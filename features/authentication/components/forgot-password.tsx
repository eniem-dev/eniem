"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { routes } from "@/config";
import { locales } from "@/locales";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthFormLayout } from "./auth-form-layout";

const forgotPasswordSchema = z.object({
  email: z.email(locales.errors.invalidEmail),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}${routes.auth.resetPassword}`,
      });

      if (result.error) {
        toast.error(result.error.message || locales.ForgotPasswordForm.errorMessage);
      } else {
        setEmailSent(true);
        toast.success(locales.ForgotPasswordForm.successMessage);
      }
    } catch (error) {
      toast.error(locales.ForgotPasswordForm.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title={locales.ForgotPasswordForm.title}
      description={locales.ForgotPasswordForm.description}
    >
      {!emailSent ? (
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{locales.ForgotPasswordForm.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder={locales.ForgotPasswordForm.emailPlaceholder}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message as string}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
            {loading || isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              locales.ForgotPasswordForm.submitButton
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-sm text-green-500">
            {locales.ForgotPasswordForm.successMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            {locales.ForgotPasswordForm.successDescription}
          </p>
        </div>
      )}

      <p className="text-center text-sm mt-4">
        <Link className="underline underline-offset-4" href={routes.auth.login}>
          {locales.ForgotPasswordForm.backToSignIn}
        </Link>
      </p>
    </AuthFormLayout>
  );
}
