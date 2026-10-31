import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Silo Works — Might as well draw it out.",
  description:
    "A simple, private place to sketch processes, connect systems, and work things out. Shelterbelt Experiment 002.",
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
