import type { ReactNode } from "react";
import { locales } from "@/locales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle } from "lucide-react";

type ErrorCardProps = {
  message: string;
  actions?: ReactNode;
};

export function ErrorCard({ message, actions }: ErrorCardProps) {
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
      {actions && (
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">{actions}</div>
        </CardContent>
      )}
    </Card>
  );
}
