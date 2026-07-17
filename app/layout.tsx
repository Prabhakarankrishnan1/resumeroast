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
  title: "Free AI Resume Review | ATS Checker | ResumeRoast",
  description:
    "Get an honest AI resume review in 30 seconds. Free ATS checker, section scores, and AI-improved resume download. No login required.",
  keywords: [
    "free resume review",
    "AI resume checker",
    "ATS resume checker",
    "resume feedback",
    "rate my resume free",
    "resume score",
    "AI resume review",
    "resumeroast",
  ],
  openGraph: {
    title: "Free AI Resume Review | ATS Checker | ResumeRoast",
    description:
      "Get an honest AI resume review in 30 seconds. Free ATS checker, section scores, and AI-improved resume download. No login required.",
    url: "https://www.resumeroast.in",
    siteName: "ResumeRoast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Resume Review | ATS Checker | ResumeRoast",
    description:
      "Get an honest AI resume review in 30 seconds. Free ATS checker, section scores, and AI-improved resume download. No login required.",
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
