import { authed } from "@/lib/handler";
import { getGitHubBenefits } from "../services/github-benefits.service";

export async function getGitHubBenefitsQuery() {
  return authed.query(async ({ user }) => {
    const benefits = await getGitHubBenefits(user.id);
    return { benefits };
  });
}
