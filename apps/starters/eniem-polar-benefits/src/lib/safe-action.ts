/* eslint-disable @typescript-eslint/no-explicit-any */
import { SafeActionResult } from "next-safe-action";
import { z } from "zod";
import { locales } from "@/locales";

export const isActionSuccessful = <T extends z.ZodType>(
  action?: SafeActionResult<string, T, readonly [], any, any>
): action is { data: T; serverError: undefined; validationErrors: undefined } => {
  if (!action) return false;
  if (action.serverError) return false;
  if (action.validationErrors) return false;
  return true;
};

export const resolveActionResult = async <T>(
  action: Promise<SafeActionResult<string, any, readonly [], never, never> | undefined>
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    action
      .then((result) => {
        if (isActionSuccessful(result)) {
          resolve(result.data as T);
        } else {
          reject(result?.serverError ?? locales.errors.serverError);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
