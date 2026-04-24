export const locales = {
  metadata: {
    title: "Your App Name - Your Tagline",
    description: "Describe what your product does and its main benefits",
    keywords: "your, product, keywords, here",
    author: "Your Name or Company",
    creator: "Your Team Name",
    publisher: "Your Company",
    applicationName: "Your App Name",
    twitterCreator: "@yourhandle",
  },

  errors: {
    // Server errors
    serverError: "Something went wrong. Please try again.",
    unauthorized: "You are not authorized to perform this action",
    notFound: "Resource not found",
    networkError: "Network error. Please check your connection.",
    unhandledError: "An unexpected error occurred",
    validationFailed: "Invalid input provided",
    invalidJsonBody: "Request body is not valid JSON",
    invalidEmail: "Please enter a valid email address",

    // Form validation errors
    nameRequired: "Display name is required",
    displayNameTooLong: "Display name must be less than 50 characters",
    confirmPasswordRequired: "Please confirm your password",

    // File validation errors
    fileRequired: "Please select an image file",
    fileTooLarge: "Image exceeds maximum file size",
    invalidFileType: "File must be an image",

    // File upload errors
    storageNotConfigured: "Storage is not properly configured",
    fileUploadFailed: "Failed to upload file. Please try again.",

    // Rate limiting errors
    rateLimitExceeded: "Too many requests. Please try again later.",

    // Credits errors
    insufficientCredits: "Insufficient credits. Please upgrade to continue.",
    creditsCheckFailed: "Unable to verify credits. Please try again.",
    rateLimitRetryAfter:
      "Too many requests. Please wait {seconds} seconds before trying again.",

    // Authentication errors
    emailNotVerified: "Please verify your email address before signing in.",
    invalidCredentials: "Invalid email or password.",
    passwordTooShort: "Password must be at least 8 characters long.",
    passwordMismatch: "Passwords do not match.",
    invalidToken: "Invalid or expired token.",
    emailRequired: "Email address is required.",
    passwordRequired: "Password is required.",
    currentPasswordRequired: "Current password is required.",
    newPasswordRequired: "New password is required.",
    unableToretrieveUser: "Unable to retrieve user information.",
    accountDeletionFailed: "Failed to initiate account deletion. Please try again.",
  },

  success: {
    profileUpdated: "Profile updated successfully",
    profileAndEmailUpdated:
      "Profile updated! Please check your email to verify the new address.",
    emailUpdateInitiated: "Please check your email to verify the new address.",
    imageUpdated: "Profile image updated successfully",
    accountCreated: "Account created successfully",
    emailSent: "Email sent successfully",
    passwordChanged: "Password changed successfully",
    actionCompleted: "Action completed successfully",
    emailVerificationSent: "Verification email sent! Please check your inbox.",
    passwordResetSent: "Password reset link sent to your email.",
    emailVerified: "Email address verified successfully!",
    passwordReset: "Password reset successfully!",
    signedIn: "Signed in successfully!",
    signedOut: "Signed out successfully!",
    deleteAccountEmailSent:
      "Verification email sent. Please check your inbox to confirm account deletion.",
  },

  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    submit: "Submit",
  },

  BuyButton: {
    label: "Buy Now",
  },

  HomePage: {
    metadata: {
      title: "Your App Name - Ship faster, scale smarter",
      description:
        "The production-ready SaaS starter with auth, payments, and email built in. Stop rebuilding the same infrastructure and start shipping what matters.",
    },
    hero: {
      badge: "Now in public beta",
      title: "Stop rebuilding. Start shipping.",
      subtitle:
        "The full-stack foundation for your next SaaS. Authentication, payments, emails, and dashboards — all wired up and ready to deploy.",
      getStarted: "Get Started",
      watchDemo: "Watch Demo",
      socialProof: "Trusted by 2,000+ developers worldwide",
    },
    logoCloud: {
      title: "Built with tools you already trust",
      items: ["Next.js", "Prisma", "Stripe", "Resend", "Tailwind", "Vercel"],
    },
    features: {
      title: "Everything you need, nothing you don't",
      subtitle:
        "Six months of boilerplate work, done in an afternoon. Each feature is production-tested and ready to customize.",
      items: [
        {
          title: "Authentication",
          description:
            "Email, OAuth, wallet login, and OTP — all preconfigured with session management and role-based access.",
        },
        {
          title: "Payments & Billing",
          description:
            "Subscription management, usage-based billing, and checkout flows. Connected and ready to accept revenue.",
        },
        {
          title: "Transactional Email",
          description:
            "Beautiful React email templates with delivery tracking. Verification, reset, and notification flows included.",
        },
        {
          title: "Security First",
          description:
            "CSRF protection, rate limiting, input validation, and encrypted sessions. Security best practices by default.",
        },
        {
          title: "Admin Dashboard",
          description:
            "A polished dashboard with analytics, user management, billing overview, and account settings.",
        },
        {
          title: "Dark Mode",
          description:
            "System-aware theming with light, dark, and auto modes. Consistent across every component.",
        },
      ],
    },
    testimonials: {
      title: "Developers ship faster with us",
      subtitle: "From solo founders to engineering teams at scale",
      items: [
        {
          quote:
            "Saved me three weeks of setup. I went from idea to paying customers in a weekend.",
          name: "Sarah Chen",
          role: "CTO at Stackwise",
          initials: "SC",
        },
        {
          quote:
            "The auth and payment integration alone is worth it. Everything just works together.",
          name: "Marcus Johnson",
          role: "Indie Hacker",
          initials: "MJ",
        },
        {
          quote:
            "We evaluated five boilerplates. This was the only one that felt production-ready out of the box.",
          name: "Elena Rodriguez",
          role: "Lead Engineer at Driftly",
          initials: "ER",
        },
      ],
    },
    pricing: {
      title: "Simple, transparent pricing",
      subtitle: "Start free, upgrade when you're ready. No surprises.",
      guarantee: "14-day money-back guarantee. No questions asked.",
    },
    cta: {
      title: "Ready to ship your SaaS?",
      subtitle:
        "Join thousands of developers who stopped rebuilding infrastructure and started building products.",
      button: "Get Started Free",
    },
  },

  ThemeSelector: {
    light: "Light",
    dark: "Dark",
    system: "System",
    toggleTheme: "Toggle Theme",
  },
  Footer: {
    builtWith: "Your Company Name. All rights reserved.",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
  },
  NavBar: {
    pricing: "Pricing",
  },
  NavAccount: {
    login: "Login",
    signup: "Signup",
    accountLabel: "Account",
    billingLabel: "Billing",
    logoutLabel: "Log out",
    dashboardLabel: "Dashboard",
    themeLabel: "Theme",
    homePageLabel: "Home",
  },

  LandingPage: {
    metadata: {
      title: "Coming Soon - Your App Name",
      description:
        "The production-ready SaaS starter kit. Auth, payments, email — all wired up. Join the waitlist.",
    },
    hero: {
      title: "Ship your SaaS in days, not months",
      subtitle:
        "The full-stack boilerplate with authentication, payments, and email — so you can focus on what makes your product unique.",
      badge: "Launching soon",
      socialProof: "Join 500+ developers on the waitlist",
    },
    features: {
      items: [
        {
          title: "Auth & Payments",
          description: "OAuth, email login, and subscription billing — preconfigured.",
        },
        {
          title: "Email & Notifications",
          description: "React email templates with transactional delivery built in.",
        },
        {
          title: "Deploy Anywhere",
          description: "Self-host or deploy to Vercel. Your infrastructure, your rules.",
        },
      ],
    },
    newsletter: {
      placeholder: "Enter your email address",
      submitButton: "Get Early Access",
      success: "Thank you! You're on the list.",
      error: "Failed to subscribe. Please try again.",
      alreadySubscribed: "You're already on our list!",
    },
  },

  // 📄 PAGES - Locales specific to pages (not in components)
  SignUpPage: {
    metadata: {
      title: "Create an account - Your App Name",
      description: "Enter your information to create an account",
    },
  },
  LoginPage: {
    metadata: {
      title: "Welcome back - Your App Name",
      description: "Enter your email below to login to your account",
    },
  },
  ForgotPasswordPage: {
    metadata: {
      title: "Reset Password - Your App Name",
      description:
        "Enter your email address and we'll send you a link to reset your password.",
    },
  },
  ResetPasswordPage: {
    metadata: {
      title: "Set New Password - Your App Name",
      description: "Enter your new password below.",
    },
  },

  DashboardPage: {
    metadata: {
      title: "Dashboard - Your App Name",
      description: "Access your dashboard to manage your account and projects",
    },
    welcome: "Welcome back",
    description: "This is your dashboard, start building. All infos are in the",
    documentationLink: "documentation",
  },

  AccountPage: {
    metadata: {
      title: "Account Settings - Your App Name",
      description:
        "Manage your personal information, change your password, and customize your profile",
    },
    title: "Account Settings",
    description: "Manage your personal information and account preferences",
    breadcrumb: {
      dashboard: "Dashboard",
      account: "Account",
    },
    sidebar: {
      general: "General",
      billing: "Billing",
      usage: "Usage",
    },
  },

  AccountGeneralPage: {
    metadata: {
      title: "General Settings - Your App Name",
      description: "Manage your personal information, display name, and email address",
    },
  },

  AccountBillingPage: {
    metadata: {
      title: "Billing Settings - Your App Name",
      description: "Manage your subscription, billing information, and payment methods",
    },
  },

  UsageHistoryPage: {
    metadata: {
      title: "Usage History - Your App Name",
      description: "View your credit consumption history and usage details",
    },
    title: "Usage History",
    loadMore: "Load more",
    loading: "Loading...",
  },

  PricingPage: {
    metadata: {
      title: "Pricing - Your App Name",
      description: "Describe your pricing options and value proposition",
    },
    title: "Your pricing headline",
    subtitle: "Describe your pricing philosophy and flexibility",
  },

  ChoosePlanPage: {
    metadata: {
      title: "Choose Your Plan - Your App Name",
      description: "Select a subscription plan to access all features.",
    },
    title: "Choose your plan",
    subtitle:
      "A subscription is required to access this feature. Select the plan that works best for you.",
    redirectingToCheckout: "Redirecting to checkout...",
    checkoutError: "Something went wrong while processing your checkout. Please try again.",
    tryAgain: "Try Again",
    contactSupport: "Contact Support",
  },

  TermsOfServicePage: {
    metadata: {
      title: "Terms of Service - Your App Name",
      description:
        "Read our terms of service to understand your rights and responsibilities when using our platform.",
    },
    title: "Terms of Service",
    lastUpdated: "Last updated:",
  },

  PrivacyPage: {
    metadata: {
      title: "Privacy Policy - Your App Name",
      description: "Learn how we collect, use, and protect your personal information.",
    },
    title: "Privacy Policy",
    lastUpdated: "Last updated:",
  },

  // 🧩 COMPONENTS - Locales specific to reusable components
  SuccessBanner: {
    title: "Payment Successful!",
    description: "Your purchase has been completed successfully.",
    checkoutId: "Order ID",
  },

  BenefitsList: {
    title: "Your Benefits",
    noBenefits:
      "You don't have any active benefits yet. Purchase a product to get started.",
    download: "Download",
    viewPortal: "View in Portal",
    githubAccess: "You now have access to this GitHub repository:",
    viewRepository: "View Repository",
  },
  DownloadablesList: {
    title: "Downloadable Files",
    noFiles: "No downloadable files available.",
    download: "Download",
    unableToLoadDownloadables:
      "Unable to load downloadable files. Please try again later.",
  },
  GitHubBenefitsList: {
    title: "GitHub Repository Access",
    noBenefits: "No GitHub repository access available.",
    viewRepository: "View Repository",
    unableToLoadBenefits: "Unable to load GitHub benefits. Please try again later.",
    granted: "Granted",
    pending: "Pending",
    connectGitHub: "Connect GitHub",
    connectGitHubPrompt:
      "Connect your GitHub account in the customer portal to get access",
  },
  SignUpForm: {
    title: "Create an account",
    description: "Enter your information to create an account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password (optional)",
    passwordPlaceholder: "Leave empty to use passwordless authentication",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm Password",
    submitButton: "Create an account",
    alreadyHaveAccount: "Already have an account ?",
    loginLink: "Login",
    signUpWithGithub: "Sign up with Github",
    signUpWithTwitter: "Sign up with Twitter",
    signUpWithEthereum: "Sign up with Ethereum",
    continueWithEmail: "Continue with Email",
    verifyAndSignUp: "Verify & Sign Up",
    signupSuccess: "Account created! Please check your email to verify your address.",
  },
  LoginForm: {
    title: "Welcome back",
    description: "Enter your email below to login to your account",
    emailLabel: "Email",
    emailPlaceholder: "m@example.com",
    passwordLabel: "Password (optional)",
    passwordPlaceholder: "Leave empty to use passwordless authentication",
    submitButton: "Login",
    forgotPassword: "Forgot your password?",
    rememberMe: "Remember me",
    orContinueWith: "Or continue with",
    signInWithGithub: "Sign in with Github",
    signInWithTwitter: "Sign in with Twitter",
    signInWithEthereum: "Sign in with Ethereum",
    dontHaveAccount: "Don't have an account ?",
    signUpLink: "Sign up",
    continueWithEmail: "Continue with Email",
    verifyAndSignIn: "Verify & Sign In",
  },
  ForgotPasswordForm: {
    title: "Reset Password",
    description:
      "Enter your email address and we'll send you a link to reset your password.",
    emailLabel: "Email address",
    emailPlaceholder: "Enter your email",
    submitButton: "Send Reset Link",
    backToSignIn: "Back to sign in",
    successMessage: "Reset link sent ! Check your email.",
    successDescription: "Check your email for a link to reset your password.",
    errorMessage: "Failed to send reset link. Please try again.",
  },
  ResetPasswordForm: {
    title: "Set New Password",
    description: "Enter your new password below.",
    passwordLabel: "New Password",
    passwordPlaceholder: "Enter new password",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm new password",
    submitButton: "Reset Password",
    successMessage: "Password reset successfully ! You can now sign in.",
    errorMessage: "Failed to reset password. Please try again.",
    invalidTokenMessage: "Invalid or expired reset token.",
  },
  ChangePasswordForm: {
    title: "Change Password",
    currentPasswordLabel: "Current Password",
    currentPasswordPlaceholder: "Enter current password",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmPasswordLabel: "Confirm New Password",
    confirmPasswordPlaceholder: "Confirm new password",
    submitButton: "Change Password",
    revokeSessionsLabel: "Sign out other devices",
    revokeSessionsDescription:
      "This will sign out all other devices that are currently logged in to your account.",
  },
  EmailVerification: {
    title: "Verify Your Email",
    description: "We sent a verification link to your email address.",
    resendButton: "Resend verification email",
    resendingButton: "Sending...",
    checkInbox: "Please check your inbox and click the verification link.",
    resendSuccess: "Verification email sent! Check your inbox.",
    resendFailed: "Failed to send verification email. Please try again.",
    signupSuccessBanner: "We sent a verification email to your address.",
    emailNotVerifiedError: "Please verify your email before signing in.",
    didntReceiveEmail: "Didn't receive the email?",
  },
  OtpVerification: {
    title: "Enter Verification Code",
    description: "We sent a 6-digit code to your email address.",
    placeholder: "000000",
    submitButton: "Verify Code",
    resendButton: "Resend code",
    resendingButton: "Sending...",
    verificationCodeLabel: "Enter verification code",
    verificationCodeInfo: "Code sent to your email",
    resendCode: "Resend",
    codeSentSuccess: "Code sent! Check your email.",
    otpVerificationSuccess: "Successfully verified!",
    otpSendFailed: "Failed to send OTP",
    otpVerificationFailed: "Failed to verify OTP",
  },
  AuthFooter: {
    agreement: "By signing up, you agree to our",
    termsOfService: "Terms of Service",
    and: "and",
    privacyPolicy: "Privacy Policy",
  },
  SocialAuthButtons: {
    signUpWithGithub: "Sign up with Github",
    signUpWithTwitter: "Sign up with Twitter",
    signUpWithEthereum: "Sign up with Ethereum",
    signInWithGithub: "Sign in with Github",
    signInWithTwitter: "Sign in with Twitter",
    signInWithEthereum: "Sign in with Ethereum",
    connectWallet: "Connect Wallet",
    switchNetwork: "Switch Network",
    ethereumSignUpFailed: "Failed to sign up with Ethereum",
    ethereumSignInFailed: "Failed to sign in with Ethereum",
  },
  ProfileForm: {
    title: "Profile Information",
    description: "Update your personal information and email address.",
    displayName: {
      label: "Display Name",
      placeholder: "Enter your display name",
      title: "Display Name",
      description:
        "This is your public display name. It can be your real name or a pseudonym.",
      updateButton: "Update Display Name",
      success: "Display name updated successfully",
    },
    email: {
      label: "Email Address",
      placeholder: "Enter your email address",
      title: "Email Address",
      description:
        "This is the email address associated with your account. You'll need to verify any changes.",
      updateButton: "Update Email",
      success:
        "Email update initiated. Please check your email to verify the new address.",
    },
    updateProfile: "Update Profile",
    messages: {
      profileUpdated: "Profile updated successfully",
    },
    errors: {
      profileUpdateFailed: "Failed to update profile. Please try again.",
    },
  },
  PasswordForm: {
    title: "Change Password",
    description: "Update your password to keep your account secure.",
    currentPassword: {
      label: "Current Password",
      placeholder: "Enter your current password",
    },
    newPassword: {
      label: "New Password",
      placeholder: "Enter new password",
    },
    confirmPassword: {
      label: "Confirm New Password",
      placeholder: "Confirm new password",
    },
    revokeOtherSessions: {
      label: "Sign out other devices",
      description:
        "This will sign out all other devices currently logged in to your account.",
    },
    updatePassword: "Update Password",
    passwordPolicy: "Password must be at least 8 characters long",
    messages: {
      passwordUpdated: "Password updated successfully",
    },
    errors: {
      passwordUpdateFailed: "Failed to update password. Please try again.",
    },
  },
  ImageForm: {
    title: "Profile Picture",
    description: "Upload a custom profile picture or use your avatar.",
    image: {
      alt: "Profile picture",
    },
    uploadText: "Click on the avatar to upload a custom one from your files.",
    optionalText: "An avatar is optional but strongly recommended.",
    uploadingText: "Uploading image...",
    messages: {
      imageUpdated: "Profile picture updated successfully",
    },
    errors: {
      imageTooLarge: "Image exceeds maximum file size",
      invalidImageType: "Please select a valid image file",
      imageUpdateFailed: "Failed to update profile picture. Please try again.",
    },
  },
  DeleteAccountForm: {
    title: "Delete Account",
    description: "Permanently delete your account and all associated data.",
    warning:
      "This action cannot be undone. All your data, subscriptions, and benefits will be permanently removed.",
    noEmailWarning:
      "Account deletion requires email verification. Please add an email address to your account first.",
    deleteButton: "Delete My Account",
    sending: "Sending verification email...",
  },
  ErrorCard: {
    title: "An error occurred",
  },

  CreditBalance: {
    creditsLabel: "{count} credits",
    loading: "Loading credits...",
    noSubscription: "Subscribe to get credits",
    zeroCredits: "0 credits",
    upgradePrompt: "Upgrade for more",
    error: "--",
  },

  BillingOverview: {
    subscriptionCard: {
      title: "Subscription",
      noSubscription: "No active subscription",
      status: {
        active: "Active",
        canceled: "Canceled",
        past_due: "Past Due",
        trialing: "Trial",
      },
      renewsOn: "Renews on",
      cancelsOn: "Cancels on",
      cancelNotice:
        "Your subscription will be canceled at the end of the current period.",
      manageSubscription: "Manage Subscription",
      perMonth: "/ month",
      perYear: "/ year",
    },
    orderHistoryCard: {
      title: "Order History",
      noOrders: "No orders yet",
      columns: {
        date: "Date",
        description: "Description",
        amount: "Amount",
        status: "Status",
      },
      status: {
        paid: "Paid",
        pending: "Pending",
        refunded: "Refunded",
      },
    },
  },

  CreditsUsageHistory: {
    title: "Usage History",
    emptyState: "No usage yet",
    showMore: "Show more",
    columns: {
      event: "Event",
      date: "Date",
    },
  },
  NotFoundPage: {
    metadata: {
      title: "Page Not Found - Your App Name",
      description: "The page you are looking for does not exist.",
    },
    code: "404",
    title: "Page not found",
    description: "Sorry, we couldn't find the page you're looking for.",
    backToHome: "Back to home",
  },

  ErrorPage: {
    code: "500",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again later.",
    tryAgain: "Try again",
    backToHome: "Back to home",
  },

  BlogPage: {
    metadata: {
      title: "Blog - Your App Name",
      description: "Read our latest articles and updates.",
    },
    title: "Blog",
    subtitle: "Our latest articles and updates",
    noPosts: "No posts yet. Check back soon!",
  },

  BlogPostPage: {
    metadata: {
      titleTemplate: "%s - Blog",
    },
    backToBlog: "Back to blog",
    notFound: "Post Not Found",
  },

  PoweredByBadge: {
    text: "Powered by eniem.dev",
  },

  Pagination: {
    previous: "Previous",
    next: "Next",
    pageOf: "Page {current} of {total}",
  },
} as const;
