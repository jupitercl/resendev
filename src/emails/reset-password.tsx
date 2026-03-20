import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  name?: string;
  resetUrl?: string;
  company?: string;
}

export const ResetPasswordEmail = ({
  name = "User",
  resetUrl = "https://example.com/reset?token=abc123",
  company = "Acme",
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your {company} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Someone requested a password reset for your account. Click the button below to choose a
          new password:
        </Text>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
        <Text style={text}>
          If you didn&apos;t request this, you can safely ignore this email. The link expires in 1
          hour.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          {company} · 123 Main Street · San Francisco, CA 94105
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const h1 = {
  color: "#1d1c1d",
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0 0 20px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
