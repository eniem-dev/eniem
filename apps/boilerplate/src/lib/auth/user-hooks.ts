import {
  sendChangeEmailVerification,
  sendDeleteAccountVerification,
} from "./email-hooks";
import { onUserDeleted } from "./side-effects";

export const userConfig = {
  changeEmail: {
    enabled: true,
    sendChangeEmailVerification,
  },
  deleteUser: {
    enabled: true,
    sendDeleteAccountVerification,
    afterDelete: async (user: { id: string }) => {
      await onUserDeleted(user.id);
    },
  },
};
