"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { routes } from "@/config";
import { locales } from "@/locales";
import { signupSchema } from "../schemas/auth.schema";
import { AuthFormLayout } from "./auth-form-layout";
import { OtpVerification } from "./otp-verification";
import { SocialAuthButtons } from "./social-auth-buttons";
import { useAuthForm } from "../hooks/use-auth-form";
import {
  getPlanSelectionFromSearchParams,
  hasPlanSelection,
  appendPlanSelectionToUrl,
} from "@/lib/plan-selection";
import type { OAuthProvider } from "@/lib/auth/oauth";

interface SignUpProps {
  availableProviders?: OAuthProvider[];
}

export default function SignUp({ availableProviders }: SignUpProps) {
  const searchParams = useSearchParams();

  const planSelection = useMemo(
    () => getPlanSelectionFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const callbackURL = hasPlanSelection(planSelection)
    ? appendPlanSelectionToUrl(routes.choosePlan, planSelection)
    : routes.dashboard;

  const loginLink = appendPlanSelectionToUrl(routes.auth.login, planSelection);

  const {
    form: { register, formState: { errors, isSubmitting } },
    loading,
    codeSent,
    password,
    handleSendCode,
    onSubmit,
    onOtpComplete,
    getValues,
  } = useAuthForm({
    schema: signupSchema,
    mode: "signup",
    callbackURL,
    loginRedirectURL: loginLink,
  });

  return (
    <AuthFormLayout
      title={locales.SignUpForm.title}
      description={locales.SignUpForm.description}
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">{locales.SignUpForm.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            placeholder={locales.SignUpForm.emailPlaceholder}
            {...register("email")}
            disabled={codeSent}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message as string}</p>
          )}
        </div>

        {!codeSent && (
          <div className="grid gap-2">
            <Label htmlFor="password">{locales.SignUpForm.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={locales.SignUpForm.passwordPlaceholder}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message as string}</p>
            )}
          </div>
        )}

        {!codeSent && password && password.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="passwordConfirmation">
              {locales.SignUpForm.confirmPasswordLabel}
            </Label>
            <Input
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              placeholder={locales.SignUpForm.confirmPasswordPlaceholder}
              {...register("passwordConfirmation")}
            />
            {errors.passwordConfirmation && (
              <p className="text-sm text-red-500">
                {errors.passwordConfirmation.message as string}
              </p>
            )}
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
            locales.SignUpForm.verifyAndSignUp
          ) : password ? (
            locales.SignUpForm.submitButton
          ) : (
            locales.SignUpForm.continueWithEmail
          )}
        </Button>
      </form>

      <SocialAuthButtons mode="signup" disabled={loading} callbackURL={callbackURL} availableProviders={availableProviders} />

      <p className="text-center text-sm mt-4">
        {locales.SignUpForm.alreadyHaveAccount}{" "}
        <Link className="underline underline-offset-4" href={loginLink}>
          {locales.SignUpForm.loginLink}
        </Link>
      </p>
    </AuthFormLayout>
  );
}
