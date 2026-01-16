import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { formatExpiryTime } from "./utils";

interface OtpEmailProps {
  otp: string;
  expiresInSeconds: number;
  brandLogoUrl?: string;
}

export function OtpEmail({
  otp = "123456",
  expiresInSeconds = 300,
  brandLogoUrl,
}: OtpEmailProps) {
  return (
    <EmailLayout
      preview={`Your verification code is ${otp}`}
      brandLogoUrl={brandLogoUrl}
    >
      <Text style={heading}>Your verification code</Text>
      <Text style={paragraph}>Enter this code to verify your identity:</Text>
      <Section style={codeContainer}>
        <Text style={code}>{otp}</Text>
      </Section>
      <Text style={paragraph}>
        This code will expire in {formatExpiryTime(expiresInSeconds)}. If you
        didn&apos;t request this code, you can safely ignore this email.
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
  margin: "0 0 16px",
};

const codeContainer = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const code = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#1a1a1a",
  textAlign: "center" as const,
  letterSpacing: "8px",
  margin: "0",
};

export default OtpEmail;
