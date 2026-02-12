"use client";

import { User } from "better-auth";
import { ImageForm } from "./image-form";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DeleteAccountForm } from "./delete-account-form";

interface AccountEditionProps {
  user: User;
  providerId: string;
}

export function AccountEdition({ user, providerId }: AccountEditionProps) {
  const isCredentialProvider = providerId === "credential";

  return (
    <div className="space-y-8">
      <ImageForm user={user} />
      <ProfileForm user={user} />
      {isCredentialProvider && <PasswordForm />}
      <DeleteAccountForm userEmail={user.email} />
    </div>
  );
}
