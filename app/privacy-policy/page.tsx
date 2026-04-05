import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy – TheSaaSBook Data Protection",
  description:
    "Read TheSaaSBook privacy policy to understand how we collect, use, and protect your personal data.",
  alternates: {
    canonical: absoluteUrl("/privacy-policy"),
  },
  openGraph: {
    title: "Privacy Policy – TheSaaSBook Data Protection",
    description:
      "Read TheSaaSBook privacy policy to understand how we collect, use, and protect your personal data.",
    url: absoluteUrl("/privacy-policy"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

const providedInformation = [
  "Email address (when contacting us or subscribing)",
  "Name or other details submitted through forms",
  "Any information you provide in support requests or communications",
];

const automaticInformation = [
  "IP address",
  "Browser type and version",
  "Device type and operating system",
  "Pages visited and time spent on the site",
  "Referring URLs and interaction data",
];

const usagePoints = [
  "Provide and operate our tools and services",
  "Improve website functionality and user experience",
  "Respond to inquiries and provide support",
  "Monitor usage patterns and detect misuse",
  "Maintain the security and integrity of our platform",
];

const cookiePoints = [
  "Enable essential website functionality",
  "Understand user behavior and traffic patterns",
  "Improve performance and usability",
];

const thirdPartyServices = [
  "Analytics providers (for traffic and usage insights)",
  "Hosting and infrastructure providers",
  "Content delivery and performance optimization services",
  "Payment processors (if applicable in the future)",
];

const securityMeasures = [
  "Encrypted data transfers using SSL",
  "Secure server infrastructure",
  "Access controls and monitoring",
];

const rights = [
  "The right to access your data",
  "The right to correct inaccurate information",
  "The right to request deletion of your data",
  "The right to restrict or object to processing",
  "The right to withdraw consent",
];

const legalBases = [
  "Your consent",
  "The need to provide our services",
  "Compliance with legal obligations",
  "Legitimate business interests, such as improving our platform and ensuring security",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5 space-y-5 text-base leading-7 text-slate-600">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          Privacy Policy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
          Last Updated: April 5, 2026
        </p>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-600 sm:text-lg">
          <p>
            TheSaaSBook (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates a platform that
            provides online tools and resources designed to simplify workflows
            for founders, marketers, and professionals.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, and
            protect your information when you use our website and services.
          </p>
        </div>
      </section>

      <Section title="1. Overview">
        <p>
          We are committed to protecting your privacy and handling your data in
          a transparent and responsible manner. We collect only the information
          necessary to provide and improve our services.
        </p>
        <p>
          By using TheSaaSBook, you agree to the practices described in this
          Privacy Policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            2.1 Information You Provide
          </h3>
          <p className="mt-3">
            We may collect personal information that you voluntarily provide,
            including:
          </p>
          <ul className="mt-4 space-y-3 text-slate-700">
            {providedInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            2.2 Automatically Collected Information
          </h3>
          <p className="mt-3">
            When you access or use our website, we may automatically collect
            certain information, including:
          </p>
          <ul className="mt-4 space-y-3 text-slate-700">
            {automaticInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            This information helps us understand how users interact with our
            platform and improve performance.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            2.3 Uploaded Files
          </h3>
          <p>When you use our tools:</p>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Files are uploaded solely for processing</li>
            <li>
              Files are not reviewed or accessed beyond what is required to
              perform the requested operation
            </li>
            <li>Files are automatically deleted after processing</li>
            <li>We do not provide permanent file storage</li>
          </ul>
        </div>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the collected information to:</p>
        <ul className="space-y-3 text-slate-700">
          {usagePoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>We do not sell or rent your personal information to third parties.</p>
      </Section>

      <Section title="4. Cookies and Tracking Technologies">
        <p>
          We use cookies and similar technologies to enhance your experience and
          analyze usage.
        </p>
        <p>Cookies may be used to:</p>
        <ul className="space-y-3 text-slate-700">
          {cookiePoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          You can control or disable cookies through your browser settings.
          Disabling cookies may affect certain features of the website.
        </p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>
          We may use trusted third-party services to support our operations,
          such as:
        </p>
        <ul className="space-y-3 text-slate-700">
          {thirdPartyServices.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          These third parties may process limited data as required to perform
          their services and are subject to their own privacy policies.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement appropriate technical and organizational measures to
          protect your information, including:
        </p>
        <ul className="space-y-3 text-slate-700">
          {securityMeasures.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          While we strive to protect your data, no method of transmission or
          storage is completely secure. We continuously work to improve our
          security practices.
        </p>
      </Section>

      <Section title="7. Data Retention">
        <p>
          We retain information only for as long as necessary to fulfill the
          purposes outlined in this policy.
        </p>
        <ul className="space-y-3 text-slate-700">
          <li>Uploaded files are deleted automatically after processing</li>
          <li>
            Personal information is retained only as required for operational,
            legal, or support purposes
          </li>
        </ul>
      </Section>

      <Section title="8. Your Rights">
        <p>
          Depending on your location, you may have rights regarding your
          personal data, including:
        </p>
        <ul className="space-y-3 text-slate-700">
          {rights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          To exercise these rights, you may contact us using the details below.
        </p>
      </Section>

      <Section title="9. Third-Party Links">
        <p>
          Our website may contain links to third-party websites. We are not
          responsible for the privacy practices or content of those external
          sites.
        </p>
      </Section>

      <Section title="10. Children&apos;s Privacy">
        <p>
          Our services are not intended for children under the age of 13. We do
          not knowingly collect personal information from children.
        </p>
      </Section>

      <Section title="11. Legal Basis for Processing">
        <p>
          We process personal data based on one or more of the following:
        </p>
        <ul className="space-y-3 text-slate-700">
          {legalBases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="12. International Data Transfers">
        <p>
          Your information may be processed and stored in locations outside your
          country. By using our services, you consent to such transfers, subject
          to applicable data protection laws.
        </p>
      </Section>

      <Section title="13. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated effective date.
        </p>
        <p>We encourage you to review this policy periodically.</p>
      </Section>

      <Section title="14. Contact Information">
        <p>
          If you have any questions about this Privacy Policy or how your data
          is handled, you can contact us at:
        </p>
        <p>
          Email:{" "}
          <a
            href="mailto:contact@thesaasbook.com"
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            contact@thesaasbook.com
          </a>
        </p>
      </Section>
    </main>
  );
}
