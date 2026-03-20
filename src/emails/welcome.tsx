import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  company?: string;
}

export const WelcomeEmail = ({ name = "User", company = "Acme" }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {company}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {company}!</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Thanks for signing up. We&apos;re excited to have you on board. Your account is all set
          and ready to go.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          {company} · 123 Main Street · San Francisco, CA 94105
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
