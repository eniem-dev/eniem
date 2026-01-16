import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-1">
            <Skeleton className="h-8 w-24" />
          </div>

          <Skeleton className="h-4 w-64" />

          <div className="pt-2">
            <Skeleton className="h-10 w-44" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4">
                      <Skeleton className="h-4 w-12" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <Skeleton className="h-4 w-24" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left py-3 px-4">
                      <Skeleton className="h-4 w-14" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(2)].map((_, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-4 pr-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-52" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-4 px-4">
                        <Skeleton className="h-6 w-14 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
