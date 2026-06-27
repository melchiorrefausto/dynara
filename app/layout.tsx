import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynara - Adaptive AI-native interfaces",
  description:
    "Dynara turns software primitives into adaptive interfaces for every user, task, and workflow."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
