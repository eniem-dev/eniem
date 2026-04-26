# Server Patterns

## Queries (RSC)

```typescript
import { authed, publicly } from "@/lib/handler";

// Public query (session can be null)
export const getData = () =>
  publicly.query(async ({ session }) => {
    return { data: "public", userId: session?.user?.id };
  });

// Authenticated query (session & user guaranteed)
// Always call a service function — no direct prisma in queries
export const getProfile = () =>
  authed.query(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

## Server Actions

```typescript
"use server";
import { authed } from "@/lib/handler";
import { updateProfileSchema } from "./schemas";

// Always call a service function — no direct prisma in actions
export const updateProfile = authed
  .input(updateProfileSchema)
  .action(async ({ input, user }) => {
    await updateUserProfile(user.id, input);
    revalidatePath("/dashboard/profile");
    return { success: true };
  });
```

## API Routes

```typescript
import { authed, publicly } from "@/lib/handler";

export const GET = publicly.route(async ({ session }) => {
  return { isAuthenticated: !!session?.user };
});

export const POST = authed
  .input(postSchema)
  .route(async ({ user, input }) => ({ created: true, userId: user.id }));
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
