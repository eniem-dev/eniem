import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface VerificationEmailProps {
  url: string;
  brandLogoUrl?: string;
}

export function VerificationEmail({
  url = "https://example.com/verify",
  brandLogoUrl,
}: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your email address" brandLogoUrl={brandLogoUrl}>
      <Text style={heading}>Verify your email</Text>
      <Text style={paragraph}>
        Click the button below to verify your email address and complete your
        registration.
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={url}>
          Verify Email
        </Button>
      </Section>
      <Text style={fallbackText}>
        If the button doesn&apos;t work, copy and paste this link into your browser:
      </Text>
      <Text style={link}>{url}</Text>
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

export default VerificationEmail;
