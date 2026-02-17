import { MailWarning, Loader2 } from "lucide-react";
import { locales } from "@/locales";

interface EmailVerificationErrorProps {
  email: string;
  onResend: (email: string) => void;
  isLoading: boolean;
}

export function EmailVerificationError({
  email,
  onResend,
  isLoading,
}: EmailVerificationErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex gap-3">
        <MailWarning className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-destructive">
            {locales.EmailVerification.emailNotVerifiedError}{" "}
            {isLoading ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {locales.EmailVerification.resendingButton}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onResend(email)}
                className="underline underline-offset-2 hover:text-destructive/80"
              >
                {locales.EmailVerification.resendButton}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
