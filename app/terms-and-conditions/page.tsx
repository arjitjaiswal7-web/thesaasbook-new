import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms & Conditions – TheSaaSBook",
  description:
    "Read TheSaaSBook terms and conditions for using our tools and services, including rights, responsibilities, and policies.",
  alternates: {
    canonical: absoluteUrl("/terms-and-conditions"),
  },
  openGraph: {
    title: "Terms & Conditions – TheSaaSBook",
    description:
      "Read TheSaaSBook terms and conditions for using our tools and services, including rights, responsibilities, and policies.",
    url: absoluteUrl("/terms-and-conditions"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

const disallowedUse = [
  "Use the Services for any illegal or unauthorized purpose",
  "Violate any applicable laws or regulations",
  "Infringe the rights of others",
];

const userResponsibilities = [
  "The content you upload",
  "Ensuring you have rights to use that content",
  "Any consequences arising from your use of the Services",
];

const prohibitedUploads = [
  "Illegal, harmful, or abusive content",
  "Copyrighted material without permission",
  "Malware or harmful files",
];

const prohibitedActivities = [
  "Use bots, scrapers, or automated systems",
  "Reverse engineer or copy our tools",
  "Attempt to overload or disrupt the platform",
  "Share access to restricted features (if applicable)",
];

const intellectualPropertyLimits = [
  "Copy, modify, or distribute our tools",
  "Use our brand or content without permission",
];

const thirdPartyLimitations = [
  "Third-party content",
  "Their privacy practices",
  "Their terms and policies",
];

const serviceAvailabilityLimits = [
  "Uninterrupted access",
  "Error-free operation",
  "Compatibility with all devices",
];

const serviceChanges = [
  "Modify or discontinue Services at any time",
  "Add or remove features without notice",
];

const liabilityLimits = [
  "Data loss",
  "Service interruptions",
  "Errors or inaccuracies",
  "Any direct or indirect damages",
];

const aiAcknowledgements = [
  "Outputs may not always be accurate",
  "You must verify results before use",
];

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
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

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms & Conditions" },
        ]}
      />

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          Terms &amp; Conditions
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Terms &amp; Conditions
        </h1>
        <div className="mt-6 space-y-3 text-sm leading-7 text-slate-500 sm:text-base">
          <p>
            <span className="font-semibold text-slate-700">Effective Date:</span>{" "}
            15 March 2026
          </p>
          <p>
            <span className="font-semibold text-slate-700">Website:</span>{" "}
            <a
              href="https://thesaasbook.com"
              className="font-medium text-sky-700 transition hover:text-sky-800"
            >
              https://thesaasbook.com
            </a>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Owner:</span> Arjit
            Jaiswal (TheSaaSBook)
          </p>
        </div>
      </section>

      <Section title="1. Introduction">
        <p>
          Welcome to TheSaaSBook (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms &amp;
          Conditions (&quot;Terms&quot;) govern your use of our website, including all
          tools, content, and services (collectively, the &quot;Services&quot;).
        </p>
        <p>
          By accessing or using our Services, you agree to be bound by these
          Terms. If you do not agree, please do not use our Services.
        </p>
      </Section>

      <Section title="2. Use of Services">
        <p>
          You agree to use our Services only for lawful purposes and in
          accordance with these Terms.
        </p>
        <p>You must not:</p>
        <ul className="space-y-3 text-slate-700">
          {disallowedUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="3. File Processing & Storage">
        <ul className="space-y-3 text-slate-700">
          <li>Files uploaded to our platform are processed temporarily.</li>
          <li>
            We <strong>do not permanently store your files</strong> unless
            explicitly stated.
          </li>
          <li>
            Files may be automatically deleted after processing (typically
            within a short time period).
          </li>
          <li>You are responsible for keeping backup copies of your files.</li>
        </ul>
        <p>
          We are <strong>not responsible for any loss of data or files</strong>.
        </p>
      </Section>

      <Section title="4. User Responsibilities">
        <p>You are solely responsible for:</p>
        <ul className="space-y-3 text-slate-700">
          {userResponsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>You agree not to upload:</p>
        <ul className="space-y-3 text-slate-700">
          {prohibitedUploads.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="5. Prohibited Activities">
        <p>You agree NOT to:</p>
        <ul className="space-y-3 text-slate-700">
          {prohibitedActivities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          All content, tools, design, and functionality on this website are
          owned by TheSaaSBook.
        </p>
        <p>
          You are granted a <strong>limited, non-exclusive, non-transferable
          license</strong> to use our Services.
        </p>
        <p>You may NOT:</p>
        <ul className="space-y-3 text-slate-700">
          {intellectualPropertyLimits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="7. Third-Party Services">
        <p>
          Our website may include integrations or links to third-party services.
        </p>
        <p>We are <strong>not responsible</strong> for:</p>
        <ul className="space-y-3 text-slate-700">
          {thirdPartyLimitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="8. Service Availability">
        <p>
          We aim to provide reliable Services, but we do not guarantee:
        </p>
        <ul className="space-y-3 text-slate-700">
          {serviceAvailabilityLimits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>We may:</p>
        <ul className="space-y-3 text-slate-700">
          {serviceChanges.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          Our Services are provided <strong>&quot;as is&quot; and &quot;as available.&quot;</strong>
        </p>
        <p>
          To the maximum extent permitted by law, we are not liable for:
        </p>
        <ul className="space-y-3 text-slate-700">
          {liabilityLimits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>Your use of the Services is at your own risk.</p>
      </Section>

      <Section title="10. AI & Automated Tools (If Applicable)">
        <p>Some tools may use automation or AI.</p>
        <p>You acknowledge:</p>
        <ul className="space-y-3 text-slate-700">
          {aiAcknowledgements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          We are not responsible for decisions made based on tool outputs.
        </p>
      </Section>

      <Section title="11. Termination">
        <p>We reserve the right to:</p>
        <ul className="space-y-3 text-slate-700">
          <li>Suspend or terminate access</li>
          <li>Block users who violate these Terms</li>
        </ul>
        <p>You may stop using our Services at any time.</p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>We may update these Terms at any time.</p>
        <p>
          Continued use of the Services after changes means you accept the
          updated Terms.
        </p>
      </Section>

      <Section title="13. Contact Information">
        <p>If you have any questions about these Terms, you can contact us at:</p>
        <p>
          <a
            href="mailto:contact@thesaasbook.com"
            className="font-semibold text-sky-700 transition hover:text-sky-800"
          >
            contact@thesaasbook.com
          </a>
        </p>
      </Section>

      <Section title="14. Governing Law">
        <p>
          These Terms shall be governed by and interpreted in accordance with
          the laws of India.
        </p>
      </Section>

      <Section title="15. Entire Agreement">
        <p>
          These Terms constitute the entire agreement between you and
          TheSaaSBook regarding the use of our Services.
        </p>
      </Section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm shadow-slate-300/20 sm:p-10">
        <p className="text-base font-semibold leading-7 sm:text-lg">
          By using our website, you confirm that you have read, understood, and
          agreed to these Terms &amp; Conditions.
        </p>
        <div className="mt-6">
          <Link
            href="/contact-us"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
