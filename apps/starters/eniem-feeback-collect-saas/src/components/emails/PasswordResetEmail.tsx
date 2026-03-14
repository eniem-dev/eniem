import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { formatExpiryTime } from "./utils";

interface PasswordResetEmailProps {
  url: string;
  expiresInSeconds: number;
  brandLogoUrl?: string;
}

export function PasswordResetEmail({
  url = "https://example.com/reset",
  expiresInSeconds = 3600,
  brandLogoUrl,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password" brandLogoUrl={brandLogoUrl}>
      <Text style={heading}>Reset your password</Text>
      <Text style={paragraph}>
        We received a request to reset your password. Click the button below to
        choose a new password.
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={url}>
          Reset Password
        </Button>
      </Section>
      <Text style={fallbackText}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
      </Text>
      <Text style={link}>{url}</Text>
      <Text style={expiry}>
        This link will expire in {formatExpiryTime(expiresInSeconds)}.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#1a1a1a",
  textAlign: "center" as const,
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const fallbackText = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
  margin: "24px 0 8px",
};

const link = {
  fontSize: "12px",
  color: "#525f7f",
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
  margin: "0",
};

const expiry = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
  margin: "16px 0 0",
};

export default PasswordResetEmail;
