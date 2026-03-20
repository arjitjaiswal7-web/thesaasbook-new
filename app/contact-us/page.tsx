import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us – TheSaaSBook Support & Queries",
  description:
    "Contact TheSaaSBook for support, questions, or business inquiries. We’re here to help you anytime.",
  alternates: {
    canonical: absoluteUrl("/contact-us"),
  },
  openGraph: {
    title: "Contact Us – TheSaaSBook Support & Queries",
    description:
      "Contact TheSaaSBook for support, questions, or business inquiries. We’re here to help you anytime.",
    url: absoluteUrl("/contact-us"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us – TheSaaSBook Support & Queries",
    description:
      "Contact TheSaaSBook for support, questions, or business inquiries. We’re here to help you anytime.",
  },
};

export default function ContactUsPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Us",
    url: absoluteUrl("/contact-us"),
    description:
      "Contact TheSaaSBook for support, questions, or business inquiries. We’re here to help you anytime.",
  };

  return (
    <>
      <JsonLd data={contactSchema} />

      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Contact Us" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
            Have questions, feedback, or partnership ideas? We&apos;d love to hear from you.
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Send a message
          </h2>
          <form
            action="mailto:contact@thesaasbook.com"
            method="post"
            encType="text/plain"
            className="mt-6 space-y-5"
          >
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                placeholder="Tell us how we can help."
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              Send Message
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Contact details
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">Email address</p>
          <a
            href="mailto:contact@thesaasbook.com"
            className="mt-2 inline-flex text-base font-semibold text-sky-700 transition hover:text-sky-800"
          >
            contact@thesaasbook.com
          </a>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            We usually respond within 24-48 hours.
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm shadow-slate-200/40 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Alternative contact
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            If you have suggestions for new tools or resources, feel free to reach out.
          </p>
        </section>
      </main>
    </>
  );
}
