import { getGitHubBenefitsQuery } from "../queries/github-benefits.query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { locales } from "@/locales";
import { ErrorCard } from "@/components/error-card";
import { CustomerPortalButton } from "@/components/customer-portal-button";

export async function GitHubBenefitsList() {
  const { data, error } = await getGitHubBenefitsQuery();

  if (error || !data) {
    return <ErrorCard message={locales.GitHubBenefitsList.unableToLoadBenefits} />;
  }

  const { benefits } = data;

  if (benefits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locales.GitHubBenefitsList.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{locales.GitHubBenefitsList.noBenefits}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locales.GitHubBenefitsList.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{benefit.repositoryName}</p>
                  {benefit.isGranted ? (
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {locales.GitHubBenefitsList.granted}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      {locales.GitHubBenefitsList.pending}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {benefit.repositoryOwner}/{benefit.repositoryName}
                </p>
                {!benefit.isGranted && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {locales.GitHubBenefitsList.connectGitHubPrompt}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {benefit.isGranted ? (
                  <a
                    href={benefit.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants()}
                  >
                    {locales.GitHubBenefitsList.viewRepository}
                  </a>
                ) : (
                  <CustomerPortalButton
                    label={locales.GitHubBenefitsList.connectGitHub}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
