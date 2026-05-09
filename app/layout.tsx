import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-WSYHM598K5";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "ResumeRoast — AI Resume Review + Skill Intelligence | Free",
  description:
    "Free AI-powered resume reviewer with section scores, ATS check, and rewrite suggestions. Plus SkillPrint: map your skills against market demand and get a personalized learning roadmap.",
  keywords: [
    "resumeroast",
    "resume roast",
    "AI resume review",
    "resume feedback",
    "resume score",
    "free resume checker",
    "resume roast AI",
  ],
  openGraph: {
    title:
      "ResumeRoast — AI Resume Review + Skill Intelligence | Free",
    description:
      "Free AI-powered resume reviewer with section scores, ATS check, and rewrite suggestions. Plus SkillPrint: map your skills against market demand and get a personalized learning roadmap.",
    url: "https://resumeroast.in",
    siteName: "ResumeRoast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "ResumeRoast — AI Resume Review + Skill Intelligence | Free",
    description:
      "Free AI-powered resume reviewer with section scores, ATS check, and rewrite suggestions. Plus SkillPrint: map your skills against market demand and get a personalized learning roadmap.",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
