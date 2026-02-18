import { execa } from "execa";
import fs from "node:fs/promises";

interface EpicInfo {
  id: string;
  title: string;
}

interface EpicTaskCounts {
  done: number;
  total: number;
}

interface SpecLine {
  name: string;
  epicId: string | null;
  tasksDone: number;
  tasksTotal: number;
}

async function isGitRepo(): Promise<boolean> {
  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

async function hasBeads(): Promise<boolean> {
  try {
    await fs.access(".beads");
    return true;
  } catch {
    return false;
  }
}

async function listSpecs(): Promise<string[]> {
  try {
    const entries = await fs.readdir("specs", { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name.replace(/\.md$/, ""))
      .sort();
  } catch {
    return [];
  }
}

async function listEpics(): Promise<EpicInfo[]> {
  try {
    const { stdout } = await execa("bd", ["list", "--type=epic", "--json"]);
    const epics = JSON.parse(stdout) as Array<{
      id: string;
      title: string;
    }>;
    return epics.map((e) => ({ id: e.id, title: e.title }));
  } catch {
    return [];
  }
}

async function getEpicTaskCounts(epicId: string): Promise<EpicTaskCounts> {
  try {
    const { stdout } = await execa("bd", [
      "count",
      `--notes-contains=${epicId}`,
      "--by-status",
      "--json",
    ]);
    const data = JSON.parse(stdout) as {
      total: number;
      groups: Array<{ group: string; count: number }>;
    };
    const closed =
      data.groups.find((g) => g.group === "closed")?.count ?? 0;
    return { done: closed, total: data.total };
  } catch {
    return { done: 0, total: 0 };
  }
}

function matchSpecToEpic(
  specName: string,
  epics: EpicInfo[],
): EpicInfo | null {
  return epics.find((e) => e.title.includes(specName)) ?? null;
}

async function getTaskCounts(): Promise<{
  ready: number;
  blocked: number;
  open: number;
  closed: number;
}> {
  const [readyCount, blockedCount, openCount, closedCount] =
    await Promise.all([
      execa("bd", ["ready", "--json"])
        .then(({ stdout }) => {
          const items = JSON.parse(stdout) as unknown[];
          return items.length;
        })
        .catch(() => 0),
      execa("bd", ["blocked", "--json"])
        .then(({ stdout }) => {
          const items = JSON.parse(stdout) as unknown[];
          return items.length;
        })
        .catch(() => 0),
      execa("bd", ["count", "--status=open", "--json"])
        .then(({ stdout }) => {
          const data = JSON.parse(stdout) as { count: number };
          return data.count;
        })
        .catch(() => 0),
      execa("bd", ["count", "--status=closed", "--json"])
        .then(({ stdout }) => {
          const data = JSON.parse(stdout) as { count: number };
          return data.count;
        })
        .catch(() => 0),
    ]);

  return {
    ready: readyCount,
    blocked: blockedCount,
    open: openCount,
    closed: closedCount,
  };
}

async function getBranchInfo(): Promise<{
  branch: string;
  ahead: number;
  behind: number;
  dirty: boolean;
}> {
  const { stdout: branch } = await execa("git", [
    "branch",
    "--show-current",
  ]);

  const { stdout: porcelain } = await execa("git", [
    "status",
    "--porcelain",
  ]);
  const dirty = porcelain.trim().length > 0;

  let ahead = 0;
  let behind = 0;
  try {
    const { stdout: aheadStr } = await execa("git", [
      "rev-list",
      "--count",
      "@{u}..HEAD",
    ]);
    ahead = parseInt(aheadStr.trim(), 10) || 0;

    const { stdout: behindStr } = await execa("git", [
      "rev-list",
      "--count",
      "HEAD..@{u}",
    ]);
    behind = parseInt(behindStr.trim(), 10) || 0;
  } catch {
    // No upstream configured — leave at 0
  }

  return { branch: branch.trim(), ahead, behind, dirty };
}

async function getLastCommit(): Promise<string> {
  try {
    const { stdout } = await execa("git", [
      "log",
      "-1",
      "--format=%cr",
    ]);
    return stdout.trim();
  } catch {
    return "no commits";
  }
}

export async function runStatus(): Promise<void> {
  // Check git repo
  if (!(await isGitRepo())) {
    console.log("Not in a git repository");
    return;
  }

  const beadsInitialized = await hasBeads();

  // Specs section
  const specs = await listSpecs();

  console.log("");
  console.log("Specs:");

  if (specs.length === 0) {
    console.log("  No specs found");
  } else {
    let epics: EpicInfo[] = [];
    if (beadsInitialized) {
      epics = await listEpics();
    }

    // Build spec lines
    const specLines: SpecLine[] = [];
    for (const specName of specs) {
      const epic = matchSpecToEpic(specName, epics);
      if (epic) {
        const counts = await getEpicTaskCounts(epic.id);
        specLines.push({
          name: specName,
          epicId: epic.id,
          tasksDone: counts.done,
          tasksTotal: counts.total,
        });
      } else {
        specLines.push({
          name: specName,
          epicId: null,
          tasksDone: 0,
          tasksTotal: 0,
        });
      }
    }

    // Calculate column width for alignment
    const maxNameLen = Math.max(...specLines.map((s) => s.name.length));

    for (const spec of specLines) {
      const padded = spec.name.padEnd(maxNameLen + 2);
      if (spec.epicId) {
        console.log(
          `  ${padded}epic: ${spec.epicId}  (${spec.tasksDone}/${spec.tasksTotal} tasks done)`,
        );
      } else if (beadsInitialized) {
        console.log(`  ${padded}no epic`);
      } else {
        console.log(`  ${spec.name}`);
      }
    }
  }

  // Beads section
  if (!beadsInitialized) {
    console.log("");
    console.log("Beads not initialized. Run: eni ai setup");
  } else {
    // Task counts
    const counts = await getTaskCounts();
    console.log("");
    console.log(
      `Tasks:  ${counts.ready} ready \u00b7 ${counts.blocked} blocked \u00b7 ${counts.open} open \u00b7 ${counts.closed} closed`,
    );
  }

  // Git section
  const branchInfo = await getBranchInfo();
  const lastCommit = await getLastCommit();

  const dirtyLabel = branchInfo.dirty ? "dirty" : "clean";
  console.log("");
  console.log(
    `Branch: ${branchInfo.branch}  (${branchInfo.ahead} ahead, ${branchInfo.behind} behind, ${dirtyLabel})`,
  );
  console.log(`Last commit: ${lastCommit}`);
}
