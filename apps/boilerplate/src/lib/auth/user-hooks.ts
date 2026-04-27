import * as emailHooks from "./email-hooks";
import * as sideEffects from "./side-effects";

export const userConfig = {
  changeEmail: {
    enabled: true,
    sendChangeEmailVerification: emailHooks.sendChangeEmailVerification,
  },
  deleteUser: {
    enabled: true,
    sendDeleteAccountVerification: emailHooks.sendDeleteAccountVerification,
    afterDelete: async (user: { id: string }) => {
      await sideEffects.onUserDeleted(user.id);
    },
  },
};
