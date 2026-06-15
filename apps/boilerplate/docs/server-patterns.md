# Server Patterns

## Queries (RSC)

```typescript
import { authed, publicly } from "@/lib/handler";
import { getUserProfile } from "../services/user-profile.service";

// Public query (session can be null)
export const getData = () =>
  publicly.query(async ({ session }) => {
    return { data: "public", userId: session?.user?.id };
  });

// Authenticated query (session & user guaranteed)
// Always call a service function — no direct prisma in queries.
export const getProfile = () =>
  authed.query(async ({ user }) => {
    return getUserProfile(user.id);
  });
```

## Server Actions

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { authed } from "@/lib/handler";
import { updateProfile } from "../services/profile.service";
import { updateProfileSchema } from "../schemas/profile.schema";

// Always call a service function — no direct prisma in actions.
export const updateProfileAction = authed
  .input(updateProfileSchema)
  .action(async ({ input, user }) => {
    await updateProfile(user.id, input);
    revalidatePath("/dashboard/profile");
    return { success: true };
  });
```

## API Routes

```typescript
import { z } from "zod";
import { authed, publicly } from "@/lib/handler";
import { createPost } from "@/features/posts/services/post.service";

export const GET = publicly.route(async ({ session }) => {
  return { isAuthenticated: !!session?.user };
});

const postSchema = z.object({ title: z.string().min(1) });

export const POST = authed
  .input(postSchema)
  .route(async ({ user, input }) => {
    const post = await createPost(user.id, input);
    return { post };
  });
```

## Error Handling

```typescript
import { ServerError, UnauthorizedError, ValidationError } from "@/lib/errors";

throw new UnauthorizedError(); // 401, logged as warn by handler wrappers
throw new ValidationError("Bad input"); // 400, logged as warn
throw new ServerError("Error", 500); // Custom status, logged as error
```

## Email

Low-level email sending uses a single discriminated message union.

```typescript
import { sendEmail } from "@/lib/email/send-email";
import type { EmailMessage, EmailResult } from "@/lib/email/types";

const msg: EmailMessage = {
  type: "verification",
  to: user.email,
  data: { token, url },
};

const result: EmailResult = await sendEmail(msg);
if (!result.success) {
  // Boundary code decides whether to throw, retry, or surface a user-facing error.
  return { success: false, error: result.error.message };
}
```

Built-in auth emails are adapted in `src/lib/auth/email-hooks.ts`:

- `{ type: "otp" }` — 6-digit verification code
- `{ type: "verification" }` — email verification/change-email link
- `{ type: "password-reset" }` — password reset link
- `{ type: "delete-account" }` — account deletion confirmation

Templates live in `src/components/emails/`. In development, `sendEmail` logs via `logger.info("email.dev", ...)`; in production, it sends via Resend using `env.email.fromAddress`.
