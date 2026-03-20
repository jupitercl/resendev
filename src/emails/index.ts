import { WelcomeEmail } from "./welcome";
import { VerificationEmail } from "./verification";
import { ResetPasswordEmail } from "./reset-password";

export interface TemplateField {
  name: string;
  label: string;
  defaultValue: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  subject: string;
  fields: TemplateField[];
  component: React.FC<Record<string, string>>;
}

export const templates: TemplateDefinition[] = [
  {
    id: "welcome",
    name: "Welcome",
    description: "Onboarding email for new users",
    subject: "Welcome to {{company}}!",
    fields: [
      { name: "name", label: "Recipient Name", defaultValue: "John Doe" },
      { name: "company", label: "Company Name", defaultValue: "Acme" },
    ],
    component: WelcomeEmail as React.FC<Record<string, string>>,
  },
  {
    id: "verification",
    name: "Verification Code",
    description: "Email verification with OTP code",
    subject: "Your verification code",
    fields: [
      { name: "code", label: "Verification Code", defaultValue: "847291" },
      { name: "company", label: "Company Name", defaultValue: "Acme" },
    ],
    component: VerificationEmail as React.FC<Record<string, string>>,
  },
  {
    id: "reset-password",
    name: "Reset Password",
    description: "Password reset link email",
    subject: "Reset your password",
    fields: [
      { name: "name", label: "Recipient Name", defaultValue: "John Doe" },
      { name: "resetUrl", label: "Reset URL", defaultValue: "https://example.com/reset?token=abc123" },
      { name: "company", label: "Company Name", defaultValue: "Acme" },
    ],
    component: ResetPasswordEmail as React.FC<Record<string, string>>,
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
