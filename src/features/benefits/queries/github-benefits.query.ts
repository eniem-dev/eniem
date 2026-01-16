import { createAuthenticatedQuery } from "@/lib/server-handler";
import { getGitHubBenefits } from "../services/github-benefits.service";

export async function getGitHubBenefitsQuery() {
  return createAuthenticatedQuery(async ({ user }) => {
    const benefits = await getGitHubBenefits(user.id);
    return { benefits };
  });
}
