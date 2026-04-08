# Server Patterns

## Queries (RSC)

```typescript
import { createQuery, createAuthenticatedQuery } from "@/lib/server-handler";

// Public query (session can be null)
export const getData = () =>
  createQuery(async ({ session }) => {
    return { data: "public", userId: session?.user?.id };
  });

// Authenticated query (session & user guaranteed)
// Always call a service function — no direct prisma in queries
export const getProfile = () =>
  createAuthenticatedQuery(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

## Server Actions

```typescript
"use server";
import { actionClient, authenticatedActionClient } from "@/lib/safe-action.server";
import { updateProfileSchema } from "./schemas";

// Always call a service function — no direct prisma in actions
export const updateProfile = authenticatedActionClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    await updateUserProfile(user.id, parsedInput);
    revalidatePath("/dashboard/profile");
    return { success: true };
  });
```

## API Routes

```typescript
import { createApiHandler, createAuthenticatedApiHandler } from "@/lib/server-handler";

export const GET = createApiHandler(async ({ session }) => {
  return { isAuthenticated: !!session?.user };
});

export const POST = createAuthenticatedApiHandler(
  async ({ user, input }) => ({ created: true, userId: user.id }),
  { validate: postSchema }
);
```

## Error Handling

```typescript
import { ServerError, UnauthorizedError, ValidationError } from "@/lib/errors";

throw new UnauthorizedError(); // 401
throw new ValidationError("Bad input"); // 400
throw new ServerError("Error", 500); // Custom status
```

## Email

```typescript
import {
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendDeleteAccountEmail,
} from "@/lib/email";

// Available functions:
await sendOtpEmail(email, otp); // 6-digit verification code
await sendVerificationEmail(email, token, url); // Email verification link
await sendPasswordResetEmail(email, token, url); // Password reset link
await sendDeleteAccountEmail(email, token, url); // Account deletion confirmation

// Templates location: components/emails/
// In dev: logs to console with OTP/token/links for easy testing
// In prod: sends via Resend using env.email.fromAddress
```
