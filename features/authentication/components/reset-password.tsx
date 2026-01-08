"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { routes } from "@/config";
import { locales } from "@/locales";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFormLayout } from "./auth-form-layout";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, locales.errors.passwordTooShort),
  confirmPassword: z.string().min(8, locales.errors.passwordTooShort),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: locales.errors.passwordMismatch,
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    const error = searchParams.get("error");

    if (error === "INVALID_TOKEN") {
      setIsValidToken(false);
      toast.error(locales.ResetPasswordForm.invalidTokenMessage);
    } else if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setIsValidToken(false);
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error(locales.ResetPasswordForm.invalidTokenMessage);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: data.newPassword,
        token: token,
      });

      if (result.error) {
        toast.error(result.error.message || locales.ResetPasswordForm.errorMessage);
      } else {
        toast.success(locales.ResetPasswordForm.successMessage);
        router.push(routes.auth.login);
      }
    } catch {
      toast.error(locales.ResetPasswordForm.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken || !token) {
    return (
      <AuthFormLayout
        title="Invalid Token"
        description={locales.ResetPasswordForm.invalidTokenMessage}
      >
        <div className="text-center space-y-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {locales.ResetPasswordForm.invalidTokenMessage}
          </div>
          <p className="text-sm text-muted-foreground">
            The reset link may have expired or been used already.
          </p>
        </div>

        <p className="text-center text-sm mt-4">
          <Link
            className="underline underline-offset-4"
            href={routes.auth.forgotPassword}
          >
            Request a new reset link
          </Link>
        </p>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout
      title={locales.ResetPasswordForm.title}
      description={locales.ResetPasswordForm.description}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="newPassword">{locales.ResetPasswordForm.passwordLabel}</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder={locales.ResetPasswordForm.passwordPlaceholder}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message as string}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">{locales.ResetPasswordForm.confirmPasswordLabel}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={locales.ResetPasswordForm.confirmPasswordPlaceholder}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message as string}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || isSubmitting}
        >
          {(loading || isSubmitting) ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            locales.ResetPasswordForm.submitButton
          )}
        </Button>
      </form>

      <p className="text-center text-sm mt-4">
        <Link
          className="underline underline-offset-4"
          href={routes.auth.login}
        >
          {locales.ForgotPasswordForm.backToSignIn}
        </Link>
      </p>
    </AuthFormLayout>
  );
}