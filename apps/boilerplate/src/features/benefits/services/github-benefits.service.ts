import { polar } from "@/lib/polar/index";
import type { GitHubBenefit } from "../models/github-benefit.model";

export async function getGitHubBenefits(userId: string): Promise<GitHubBenefit[]> {
  return polar.listGitHubBenefits(userId);
}
