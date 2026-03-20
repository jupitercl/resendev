import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface VerificationEmailProps {
  code?: string;
  company?: string;
}

export const VerificationEmail = ({ code = "123456", company = "Acme" }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your verification code: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Enter the following code to verify your email address:
        </Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{code}</Text>
        </Section>
        <Text style={text}>
          This code expires in 10 minutes. If you didn&apos;t request this, you can safely ignore
          this email.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          {company} · 123 Main Street · San Francisco, CA 94105
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

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

const codeContainer = {
  background: "#f4f4f5",
  borderRadius: "8px",
  margin: "16px 0",
  padding: "24px",
  textAlign: "center" as const,
};

const codeStyle = {
  color: "#1d1c1d",
  fontSize: "36px",
  fontWeight: "700" as const,
  letterSpacing: "6px",
  margin: "0",
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
