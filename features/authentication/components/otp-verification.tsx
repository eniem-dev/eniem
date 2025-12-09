import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { locales } from "@/locales";

interface OtpVerificationProps {
  onComplete: (value: string) => void;
  onResend: () => void;
  isLoading: boolean;
  email: string;
}

export function OtpVerification({ onComplete, onResend, isLoading, email }: OtpVerificationProps) {
  return (
    <div className="grid gap-3">
      <Label>{locales.OtpVerification.verificationCodeLabel}</Label>
      <div className="mx-auto">
        <InputOTP maxLength={6} onComplete={onComplete}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {locales.OtpVerification.verificationCodeInfo}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={isLoading}
        >
          {locales.OtpVerification.resendCode}
        </Button>
      </div>
    </div>
  );
}