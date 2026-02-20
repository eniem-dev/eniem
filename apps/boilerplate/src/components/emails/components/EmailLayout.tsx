import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  brandLogoUrl?: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, brandLogoUrl, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            {brandLogoUrl && (
              <Img src={brandLogoUrl} width="40" height="40" alt="Logo" style={logo} />
            )}
          </Section>
          {children}
          <Text style={footer}>
            This email was sent by MyApp. If you didn&apos;t request this, you can safely
            ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  margin: "0 auto",
  borderRadius: "100%",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
};
