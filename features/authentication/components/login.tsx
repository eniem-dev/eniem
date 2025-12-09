"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/config";
import { locales } from "@/locales";
import { loginSchema } from "../schemas/auth.schema";
import { AuthFormLayout } from "./auth-form-layout";
import { OtpVerification } from "./otp-verification";
import { SocialAuthButtons } from "./social-auth-buttons";
import { EmailVerificationError } from "./email-verification-error";
import { EmailVerificationSuccess } from "./email-verification-success";
import { useAuthForm } from "../hooks/use-auth-form";

export default function Login() {
  const searchParams = useSearchParams();
  const isFromSignup = searchParams.get("verified") === "pending";
  const emailFromSignup = searchParams.get("email") || "";

  const {
    form: { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue },
    loading,
    codeSent,
    password,
    emailNotVerified,
    pendingVerificationEmail,
    handleSendCode,
    handleAuthSubmit,
    onOtpComplete,
    resendVerificationEmail,
    getValues,
  } = useAuthForm({ schema: loginSchema, mode: "login" });

  // Pre-fill email from signup redirect
  useEffect(() => {
    if (emailFromSignup) {
      setValue("email", emailFromSignup);
    }
  }, [emailFromSignup, setValue]);

  const emailValue = watch("email");

  return (
    <AuthFormLayout
      title={locales.LoginForm.title}
      description={locales.LoginForm.description}
    >
      <form onSubmit={handleSubmit(handleAuthSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{locales.LoginForm.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            placeholder={locales.LoginForm.emailPlaceholder}
            {...register("email")}
            disabled={codeSent}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message as string}</p>
          )}
        </div>

        {!codeSent && (
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">{locales.LoginForm.passwordLabel}</Label>
              <Link
                href={routes.auth.forgotPassword}
                className="ml-auto inline-block text-sm underline"
              >
                {locales.LoginForm.forgotPassword}
              </Link>
            </div>

            <Input
              id="password"
              type="password"
              placeholder={locales.LoginForm.passwordPlaceholder}
              autoComplete="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message as string}</p>
            )}
          </div>
        )}

        {!codeSent && (
          <div className="flex items-center gap-2">
            <Checkbox id="remember" {...register("rememberMe")} />
            <Label htmlFor="remember">{locales.LoginForm.rememberMe}</Label>
          </div>
        )}

        {codeSent && (
          <OtpVerification
            onComplete={onOtpComplete}
            onResend={() => handleSendCode(getValues("email"))}
            isLoading={isSubmitting || loading}
            email={getValues("email")}
          />
        )}

        <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
          {loading || isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : codeSent ? (
            locales.LoginForm.verifyAndSignIn
          ) : password ? (
            locales.LoginForm.submitButton
          ) : (
            locales.LoginForm.continueWithEmail
          )}
        </Button>

        {isFromSignup && !emailNotVerified && (
          <EmailVerificationSuccess
            email={emailValue || ""}
            onResend={resendVerificationEmail}
            isLoading={loading}
          />
        )}

        {emailNotVerified && pendingVerificationEmail && (
          <EmailVerificationError
            email={pendingVerificationEmail}
            onResend={resendVerificationEmail}
            isLoading={loading}
          />
        )}
      </form>

      <SocialAuthButtons mode="signin" disabled={loading} />

      <p className="text-center text-sm mt-4">
        {locales.LoginForm.dontHaveAccount}{" "}
        <Link className="underline underline-offset-4" href={routes.auth.signup}>
          {locales.LoginForm.signUpLink}
        </Link>
      </p>
    </AuthFormLayout>
  );
}
