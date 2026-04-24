import { authed } from "@/lib/handler";
import { getDownloadables } from "../services/downloadables.service";

export async function getDownloadablesQuery() {
  return authed.query(async ({ user }) => {
    const files = await getDownloadables(user.id);
    return { files };
  });
}
