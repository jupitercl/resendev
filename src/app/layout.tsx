import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resendev",
  description: "Local development server for the Resend email API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
