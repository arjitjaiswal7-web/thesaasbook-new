import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Security – Data Protection & Safety | TheSaaSBook",
  description:
    "Learn how TheSaaSBook protects your data with secure file processing, encryption, and privacy-focused systems.",
  alternates: {
    canonical: absoluteUrl("/security"),
  },
  openGraph: {
    title: "Security – Data Protection & Safety | TheSaaSBook",
    description:
      "Learn how TheSaaSBook protects your data with secure file processing, encryption, and privacy-focused systems.",
    url: absoluteUrl("/security"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

const securityPoints = [
  "Secure file handling",
  "Encrypted data transfers",
  "No unnecessary data storage",
  "Continuous system improvements",
];

const privacyPoints = [
  "Your files are used only for the requested operation",
  "We do not access, review, or analyze your content beyond processing",
  "We do not sell, share, or distribute your data",
  "Your documents remain private and accessible only to you.",
];

const processingPoints = [
  "Files are uploaded only to complete the requested task",
  "Files are not stored permanently",
  "Files are automatically deleted after processing",
  "We do not provide long-term storage, ensuring your data does not remain on our servers.",
];

const infrastructurePoints = [
  "Handle processing efficiently",
  "Maintain system stability",
  "Ensure consistent performance under varying workloads",
];

const protectionPoints = [
  "Controlled system access",
  "Monitoring of platform activity",
  "Protection against common security threats",
];

export default function SecurityPage() {
  const securitySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Security & Data Protection",
    url: absoluteUrl("/security"),
    description:
      "Information about secure file processing, data privacy, encryption, and automatic deletion on TheSaaSBook.",
  };

  return (
    <>
      <JsonLd data={securitySchema} />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Security" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Security
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Security &amp; Data Protection
          </h1>
          <div className="mt-6 space-y-5 text-base leading-7 text-slate-600 sm:text-lg">
            <p>
              At TheSaaSBook, we take security and data protection seriously.
            </p>
            <p>
              Our platform is designed to process your files quickly while
              ensuring your data remains private, secure, and handled
              responsibly.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Our Approach to Security
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We focus on practical, real-world security measures that protect
            your data throughout the entire process - from upload to final
            output.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {securityPoints.map((point) => (
              <li
                key={point}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
              >
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Data Privacy
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Your privacy is a priority.
          </p>
          <ul className="mt-6 space-y-3 text-base leading-7 text-slate-600">
            {privacyPoints.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            File Processing &amp; Storage
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We follow a minimal data retention approach.
          </p>
          <ul className="mt-6 space-y-3 text-base leading-7 text-slate-600">
            {processingPoints.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Secure Transfers
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            All file uploads and downloads are protected using SSL encryption,
            ensuring secure communication between your device and our servers.
          </p>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Infrastructure &amp; Reliability
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Our platform is built on secure and scalable cloud infrastructure
            designed to:
          </p>
          <ul className="mt-6 space-y-3 text-base leading-7 text-slate-600">
            {infrastructurePoints.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Access &amp; Protection
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We take steps to prevent unauthorized access and ensure a safe
            environment:
          </p>
          <ul className="mt-6 space-y-3 text-base leading-7 text-slate-600">
            {protectionPoints.map((point) => (
              <li key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Continuous Improvement
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Security is an ongoing process. We regularly review and improve our
            systems, tools, and workflows to keep up with evolving security
            standards and best practices.
          </p>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Transparency
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            We believe in clear and honest communication about how your data is
            handled. If you have any questions about security or privacy, feel
            free to contact us.
          </p>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
            No sign-up required • Secure processing • Files deleted after use
          </p>
        </section>
      </main>
    </>
  );
}
