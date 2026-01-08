"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserInfos } from "../settings.types";
import { useUserUpdate } from "../hooks/use-user-update";

import { locales } from "@/locales";

interface ProfileFormProps {
  user: UserInfos;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const { updateDisplayName, updateEmail } = useUserUpdate();

  // Separate loading states for each form
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Separate form for display name
  const displayNameForm = useForm<{ displayName: string }>({
    resolver: zodResolver(
      z.object({
        displayName: z
          .string()
          .min(1, locales.errors.nameRequired)
          .max(50, locales.errors.displayNameTooLong),
      })
    ),
    defaultValues: {
      displayName: user.name || "",
    },
  });

  // Separate form for email
  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(
      z.object({
        email: z.email(locales.errors.invalidEmail),
      })
    ),
    defaultValues: {
      email: user.email || "",
    },
  });

  const onDisplayNameSubmit = async (data: { displayName: string }) => {
    setIsDisplayNameLoading(true);
    try {
      await updateDisplayName(data);
      displayNameForm.reset({ displayName: data.displayName });
    } finally {
      setIsDisplayNameLoading(false);
    }
  };

  const onEmailSubmit = async (data: { email: string }) => {
    setIsEmailLoading(true);
    try {
      await updateEmail(data);
      emailForm.reset({ email: data.email });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const isDisplayNameSubmitting =
    displayNameForm.formState.isSubmitting || isDisplayNameLoading;
  const isEmailSubmitting = emailForm.formState.isSubmitting || isEmailLoading;

  return (
    <div className="space-y-8">
      {/* Display Name Section */}
      <form onSubmit={displayNameForm.handleSubmit(onDisplayNameSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{locales.ProfileForm.title}</CardTitle>
            <CardDescription>{locales.ProfileForm.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  {locales.ProfileForm.displayName.label}
                </Label>
                <Input
                  id="displayName"
                  {...displayNameForm.register("displayName")}
                  placeholder={locales.ProfileForm.displayName.placeholder}
                  disabled={isDisplayNameSubmitting}
                />
                {displayNameForm.formState.errors.displayName && (
                  <p className="text-sm text-red-500">
                    {displayNameForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border flex justify-between">
            <p className="text-sm text-muted-foreground">
              {locales.ProfileForm.displayName.placeholder}
            </p>
            <Button type="submit" loading={isDisplayNameSubmitting}>
              {locales.ProfileForm.updateProfile}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Email Section */}
      <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{locales.ProfileForm.email.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  {...emailForm.register("email")}
                  placeholder={locales.ProfileForm.email.placeholder}
                  disabled={isEmailSubmitting}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border flex justify-end">
            <Button type="submit" loading={isEmailSubmitting}>
              {locales.ProfileForm.updateProfile}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
