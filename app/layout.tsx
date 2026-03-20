import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeRoast - Free AI Resume Reviewer | Get Instant Feedback",
  description:
    "Upload your resume and get brutally honest AI feedback with scores, section-by-section analysis, and rewrite suggestions. Free, fast, and private.",
  keywords: [
    "resume review",
    "AI resume feedback",
    "resume score",
    "resume checker",
    "free resume review",
  ],
  openGraph: {
    title: "ResumeRoast - Free AI Resume Reviewer | Get Instant Feedback",
    description:
      "Upload your resume and get brutally honest AI feedback with scores, section-by-section analysis, and rewrite suggestions. Free, fast, and private.",
    url: "https://resumeroast.in",
    siteName: "ResumeRoast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeRoast - Free AI Resume Reviewer | Get Instant Feedback",
    description:
      "Upload your resume and get brutally honest AI feedback with scores, section-by-section analysis, and rewrite suggestions. Free, fast, and private.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="50iimzAMTM58boXmg2u4cHhclwvTgDEflI4ux4qhpBg"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
