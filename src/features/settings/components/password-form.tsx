"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updatePasswordSchema, type UpdatePasswordInput } from "../settings.schemas";
import { useUserUpdate } from "../hooks/use-user-update";
import { locales } from "@/locales";

/**
 * Password form component for updating user password
 * Handles password change with confirmation
 */
export function PasswordForm() {
  const { updatePassword, isLoading } = useUserUpdate();
  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });

  const onSubmit = async (data: UpdatePasswordInput) => {
    try {
      await updatePassword(data);
      form.reset();
    } catch (error) {
      console.error("Password update error:", error);
      // Error handling is done in the hook
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{locales.PasswordForm.title}</CardTitle>
          <CardDescription>{locales.PasswordForm.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {locales.PasswordForm.currentPassword.label}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                {...form.register("currentPassword")}
                placeholder={locales.PasswordForm.currentPassword.placeholder}
                disabled={isSubmitting}
              />
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {locales.PasswordForm.newPassword.label}
              </Label>
              <Input
                id="newPassword"
                type="password"
                {...form.register("newPassword")}
                placeholder={locales.PasswordForm.newPassword.placeholder}
                disabled={isSubmitting}
              />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {locales.PasswordForm.confirmPassword.label}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
                placeholder={locales.PasswordForm.confirmPassword.placeholder}
                disabled={isSubmitting}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="revokeOtherSessions"
                checked={form.watch("revokeOtherSessions") || false}
                onCheckedChange={(checked) => {
                  form.setValue("revokeOtherSessions", checked === true);
                }}
                disabled={isSubmitting}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="revokeOtherSessions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {locales.PasswordForm.revokeOtherSessions.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {locales.PasswordForm.revokeOtherSessions.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border flex justify-between">
          <p className="text-sm text-muted-foreground">
            {locales.PasswordForm.passwordPolicy}
          </p>
          <Button type="submit" loading={isSubmitting}>
            {locales.PasswordForm.updatePassword}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
