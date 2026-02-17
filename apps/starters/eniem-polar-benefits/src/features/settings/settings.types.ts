import type { User } from "better-auth";

export interface UserInfos extends User {
  displayName?: string | null;
  image?: string | null;
}

export interface UpdateProfileInput {
  displayName?: string;
  email?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions?: boolean;
}

export interface UpdateImageInput {
  image: File;
}