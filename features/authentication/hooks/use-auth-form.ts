import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { signUp, signIn } from "@/lib/auth-client";
import { routes } from "@/config";
import { locales } from "@/locales";
import type { LoginFormData, SignupFormData } from "../schemas/auth.schema";
import type { z } from "zod";

type AuthFormData = LoginFormData | SignupFormData;

interface AuthFormOptions {
  schema: z.ZodType<AuthFormData>;
  mode: "login" | "signup";
  callbackURL?: string;
  loginRedirectURL?: string;
}

export function useAuthForm({ schema, mode, callbackURL, loginRedirectURL }: AuthFormOptions) {
  const redirectURL = callbackURL ?? routes.dashboard;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(schema),
    defaultValues: mode === "signup"
      ? {
          email: "",
          password: "",
          passwordConfirmation: "",
          otp: "",
        }
      : {
          email: "",
          password: "",
          rememberMe: false,
          otp: "",
        },
  });

  const { handleSubmit, setValue, getValues, watch } = form;
  const password = watch("password");

  const handleSendCode = async (email: string) => {
    setLoading(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message || locales.OtpVerification.otpSendFailed);
      } else {
        setCodeSent(true);
        toast.success(locales.OtpVerification.codeSentSuccess);
      }
    } catch {
      toast.error(locales.OtpVerification.otpSendFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      const { email, password, otp } = data;

      if (password && password.length > 0) {
        if (mode === "signup") {
          const loginURL = loginRedirectURL ?? routes.auth.login;
          await signUp.email(
            {
              email,
              password,
              name: email.split("@")[0],
              callbackURL: redirectURL,
            },
            {
              onRequest: () => setLoading(true),
              onResponse: () => setLoading(false),
              onError: (ctx) => {
                toast.error(ctx.error.message);
              },
              onSuccess: () => {
                toast.success(locales.SignUpForm.signupSuccess);
                router.push(`${loginURL}${loginURL.includes("?") ? "&" : "?"}verified=pending&email=${encodeURIComponent(email)}`);
              },
            }
          );
        } else {
          await signIn.email(
            { email, password },
            {
              onRequest: () => setLoading(true),
              onResponse: () => setLoading(false),
              onError: (ctx) => {
                const isEmailNotVerified =
                  ctx.error.code === "EMAIL_NOT_VERIFIED" ||
                  ctx.error.message?.toLowerCase().includes("email not verified");

                if (isEmailNotVerified) {
                  setEmailNotVerified(true);
                  setPendingVerificationEmail(email);
                } else {
                  toast.error(ctx.error.message);
                }
              },
              onSuccess: () => router.push(redirectURL),
            }
          );
        }
      } else if (otp && otp.length > 0) {
        const result = await signIn.emailOtp({ email, otp });

        if (result.error) {
          toast.error(result.error.message || locales.OtpVerification.otpVerificationFailed);
        } else {
          toast.success(locales.OtpVerification.otpVerificationSuccess);
          router.push(redirectURL);
        }
      } else {
        await handleSendCode(email);
        return;
      }
    } catch {
      setLoading(false);
      toast.error(locales.errors.serverError);
    }
  };

  const onOtpComplete = (value: string) => {
    setValue("otp", value);
    handleSubmit(handleAuthSubmit)();
  };

  const resendVerificationEmail = async (email: string) => {
    setLoading(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: redirectURL,
      });

      if (result.error) {
        toast.error(locales.EmailVerification.resendFailed);
      } else {
        toast.success(locales.EmailVerification.resendSuccess);
      }
    } catch {
      toast.error(locales.EmailVerification.resendFailed);
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
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
  };
}