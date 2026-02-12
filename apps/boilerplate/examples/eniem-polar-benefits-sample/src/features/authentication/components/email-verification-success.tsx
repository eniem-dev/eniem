import { CheckCircle2, Loader2 } from "lucide-react";
import { locales } from "@/locales";

interface EmailVerificationSuccessProps {
  email: string;
  onResend: (email: string) => void;
  isLoading: boolean;
}

export function EmailVerificationSuccess({
  email,
  onResend,
  isLoading,
}: EmailVerificationSuccessProps) {
  return (
    <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4">
      <div className="flex gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div className="flex-1  text-sm text-green-700 dark:text-green-400">
          <p>{locales.EmailVerification.signupSuccessBanner}</p>
          <p>{locales.EmailVerification.didntReceiveEmail}</p>

          <p>
            {isLoading ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {locales.EmailVerification.resendingButton}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onResend(email)}
                className="underline underline-offset-2 hover:text-green-600 dark:hover:text-green-300"
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
