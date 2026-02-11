import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { locales } from "@/locales";

export function GitHubBenefitsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{locales.GitHubBenefitsList.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
