import { locales } from "@/locales";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle } from "lucide-react";

type ErrorCardProps = {
  message: string;
};

export async function ErrorCard({ message }: ErrorCardProps) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
          <AlertTriangle className="h-5 w-5" />
          {locales.ErrorCard.title}
        </CardTitle>
        <CardDescription className="text-red-700 dark:text-red-300">
          {message}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
