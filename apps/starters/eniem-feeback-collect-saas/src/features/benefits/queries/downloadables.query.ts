import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getDownloadables } from "../services/downloadables.service";

export async function getDownloadablesQuery() {
  return createAuthenticatedQuery(async ({ user }) => {
    const files = await getDownloadables(user.id);
    return { files };
  });
}
