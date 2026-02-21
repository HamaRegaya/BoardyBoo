import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoardyBoo — AI Whiteboard Tutor",
  description: "The AI tutor that draws while it teaches. Ask a question, watch BoardyBoo explain it live on a whiteboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
