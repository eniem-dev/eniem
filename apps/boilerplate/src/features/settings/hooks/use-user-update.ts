import { useState } from "react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { locales } from "@/locales";
import { logger } from "@/lib/logger";
import type {
  UpdateProfileInput,
  UpdateDisplayNameInput,
  UpdateEmailInput,
  UpdatePasswordInput,
} from "../settings.schemas";
import { routes } from "@/config";

export function useUserUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const { refetch } = useSession();

  const updateProfile = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      let nameUpdated = false;
      let emailUpdated = false;

      // Update display name if provided
      if (data.displayName) {
        const result = await authClient.updateUser({
          name: data.displayName,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
        nameUpdated = true;
      }

      // Update email if provided
      if (data.email) {
        const emailResult = await authClient.changeEmail({
          newEmail: data.email,
          callbackURL: routes.account.general,
        });

        if (emailResult.error) {
          throw new Error(emailResult.error.message);
        }
        emailUpdated = true;
      }

      // Show appropriate success message
      if (nameUpdated && emailUpdated) {
        toast.success(locales.success.profileAndEmailUpdated);
      } else if (emailUpdated) {
        toast.success(locales.success.emailUpdateInitiated);
      } else if (nameUpdated) {
        toast.success(locales.success.profileUpdated);
      }

      // Refresh session to get updated user data
      await refetch();
      return { name: data.displayName };
    } catch (error) {
      logger.error("updateProfile error:", error);
      const errorMessage =
        error instanceof Error ? error.message : locales.errors.serverError;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayName = async (data: UpdateDisplayNameInput) => {
    setIsLoading(true);
    try {
      const result = await authClient.updateUser({
        name: data.displayName,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success(locales.ProfileForm.displayName.success);

      // Refresh session to get updated user data
      await refetch();
      return result.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : locales.errors.serverError;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = async (data: UpdateEmailInput) => {
    setIsLoading(true);
    try {
      const emailResult = await authClient.changeEmail({
        newEmail: data.email,
        callbackURL: routes.account.general, // Redirect back to account page after email verification
      });

      if (emailResult.error) {
        throw new Error(emailResult.error.message);
      }

      toast.success(locales.ProfileForm.email.success);
      return emailResult.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : locales.errors.serverError;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (data: UpdatePasswordInput) => {
    setIsLoading(true);
    try {
      const result = await authClient.changePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
        revokeOtherSessions: data.revokeOtherSessions || false,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success(locales.success.passwordChanged);
      return result.data;
    } catch (error) {
      logger.error("updatePassword error:", error);
      const errorMessage =
        error instanceof Error ? error.message : locales.errors.serverError;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserImage = async (imageUrl: string) => {
    setIsLoading(true);
    try {
      const result = await authClient.updateUser({
        image: imageUrl,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success(locales.success.imageUpdated);

      // Refresh session to get updated user data
      await refetch();
      return result.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : locales.errors.serverError;
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    updateDisplayName,
    updateEmail,
    updatePassword,
    updateUserImage,
    isLoading,
  };
}
