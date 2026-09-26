import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter: a neutral, highly legible UI face with clear numerals — suited to
// tables and figures.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Survey Insight",
  description:
    "Turn messy survey and customer feedback data into clean insights, charts, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
