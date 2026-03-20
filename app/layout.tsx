import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const defaultTitle = "Free Online Tools for SaaS Founders & Marketers";

const siteFaqs = [
  {
    question: "What is TheSaaSBook?",
    answer:
      "TheSaaSBook is a focused website for SaaS founders and marketers that combines practical PDF tools with a high-signal blog.",
  },
  {
    question: "What tools are available on TheSaaSBook?",
    answer:
      "The current collection focuses on fast PDF workflows including merging, splitting, compressing, and converting documents.",
  },
  {
    question: "Who is TheSaaSBook built for?",
    answer:
      "TheSaaSBook is built for founders, marketers, and lean teams who want faster execution and a cleaner operating stack.",
  },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  description: siteConfig.description,
  logo: absoluteUrl("/favicon.ico"),
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.siteUrl,
  description: siteConfig.description,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: siteConfig.name,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: siteFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: `${siteConfig.name} | ${defaultTitle}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${siteConfig.name} | ${defaultTitle}`,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${defaultTitle}`,
    description: siteConfig.description,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-950 antialiased`}
      >
        <div className="relative isolate flex min-h-screen flex-col overflow-x-clip">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[38rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_38%),radial-gradient(circle_at_18%_18%,_rgba(15,23,42,0.06),_transparent_24%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_52%,_#f8fafc_100%)]" />
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <JsonLd data={[organizationSchema, websiteSchema, faqSchema]} />
        </div>
      </body>
    </html>
  );
}
