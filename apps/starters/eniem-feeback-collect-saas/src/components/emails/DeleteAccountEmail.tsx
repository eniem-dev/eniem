import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface DeleteAccountEmailProps {
  url: string;
  brandLogoUrl?: string;
}

export function DeleteAccountEmail({
  url = "https://example.com/delete",
  brandLogoUrl,
}: DeleteAccountEmailProps) {
  return (
    <EmailLayout preview="Confirm account deletion" brandLogoUrl={brandLogoUrl}>
      <Text style={heading}>Confirm Account Deletion</Text>
      <Text style={paragraph}>
        We received a request to permanently delete your account. This action
        cannot be undone. All your data, subscriptions, and benefits will be
        permanently removed.
      </Text>
      <Text style={warningText}>
        If you did not request this, please ignore this email. Your account
        will remain safe.
      </Text>
      <Section style={buttonContainer}>
        <Button style={button} href={url}>
          Confirm Deletion
        </Button>
      </Section>
      <Text style={fallbackText}>
        If the button doesn&apos;t work, copy and paste this link into your
        browser:
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
  margin: "0 0 16px",
};

const warningText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#dc2626",
  textAlign: "center" as const,
  margin: "0 0 24px",
  fontWeight: "500" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#dc2626",
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

export default DeleteAccountEmail;
