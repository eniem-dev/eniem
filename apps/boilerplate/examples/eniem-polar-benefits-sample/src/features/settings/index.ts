// Components
export { AccountEdition } from "./components/account-edition";
export { ProfileForm } from "./components/profile-form";
export { PasswordForm } from "./components/password-form";
export { ImageForm } from "./components/image-form";
export { DeleteAccountForm } from "./components/delete-account-form";

// Actions
export { updateImageAction } from "./settings.action";

// Hooks
export { useUserUpdate } from "./hooks/use-user-update";

// Schemas
export {
  updateProfileSchema,
  updatePasswordSchema,
  updateImageSchema,
} from "./settings.schemas";

// Types
export type {
  UserInfos,
  UpdateProfileInput,
  UpdatePasswordInput,
  UpdateImageInput,
} from "./settings.types";
