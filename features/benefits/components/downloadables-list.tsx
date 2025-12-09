import { getDownloadablesQuery } from "../queries/downloadables.query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { locales } from "@/locales";
import { ErrorCard } from "@/components/error-card";

export async function DownloadablesList() {
  const { data, error } = await getDownloadablesQuery();

  if (error || !data) {
    return <ErrorCard message={locales.DownloadablesList.unableToLoadDownloadables} />;
  }

  const { files } = data;

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locales.DownloadablesList.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{locales.DownloadablesList.noFiles}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locales.DownloadablesList.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{file.sizeReadable}</p>
              </div>
              <a
                href={file.downloadUrl}
                download
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                {locales.DownloadablesList.download}
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
