"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { locales } from "@/locales";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface DeleteAccountFormProps {
  userEmail: string | null | undefined;
}

export function DeleteAccountForm({ userEmail }: DeleteAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const hasEmail = Boolean(userEmail);

  const handleDeleteAccount = async () => {
    if (!hasEmail) return;

    setIsLoading(true);
    try {
      await authClient.deleteUser();
      toast.success(locales.success.deleteAccountEmailSent);
    } catch {
      toast.error(locales.errors.accountDeletionFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">
          {locales.DeleteAccountForm.title}
        </CardTitle>
        <CardDescription>{locales.DeleteAccountForm.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {hasEmail
            ? locales.DeleteAccountForm.warning
            : locales.DeleteAccountForm.noEmailWarning}
        </p>
      </CardContent>
      <CardFooter className="border-t border-destructive/50 flex justify-end">
        <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          loading={isLoading}
          disabled={!hasEmail}
        >
          {isLoading
            ? locales.DeleteAccountForm.sending
            : locales.DeleteAccountForm.deleteButton}
        </Button>
      </CardFooter>
    </Card>
  );
}
