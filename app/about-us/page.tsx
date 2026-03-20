import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { blogAuthor } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About TheSaaSBook – SaaS Tools & Learning Platform",
  description:
    "Learn about TheSaaSBook, a platform providing SaaS tools, strategies, and guides to help you grow your business.",
  alternates: {
    canonical: absoluteUrl("/about-us"),
  },
  openGraph: {
    title: "About TheSaaSBook – SaaS Tools & Learning Platform",
    description:
      "Learn about TheSaaSBook, a platform providing SaaS tools, strategies, and guides to help you grow your business.",
    url: absoluteUrl("/about-us"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function AboutUsPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About TheSaaSBook",
    url: absoluteUrl("/about-us"),
    description:
      "Learn about TheSaaSBook, a platform providing SaaS tools, strategies, and guides to help you grow your business.",
  };

  return (
    <>
      <JsonLd data={aboutSchema} />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            About
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            About TheSaaSBook
          </h1>
          <div className="mt-6 space-y-5 text-base leading-7 text-slate-600 sm:text-lg">
            <p>
              TheSaaSBook is a platform built to simplify everyday work for
              founders, marketers, and builders.
            </p>
            <p>
              It combines practical tools with actionable insights to help you
              move faster, make better decisions, and stay focused on what
              matters.
            </p>
            <p>
              Whether you&apos;re managing documents, optimizing workflows, or
              exploring growth strategies, TheSaaSBook is designed to remove
              friction and save time.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            What We Do
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            We focus on two core areas:
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Powerful Online Tools
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Simple, fast, and reliable tools designed to handle real-world
                tasks - from PDF workflows to upcoming calculators and
                productivity tools.
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Actionable SaaS Insights
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Clear, practical content that helps you understand, build, and
                grow modern software businesses without unnecessary complexity.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Our Mission
          </h2>
          <div className="mt-6 space-y-5 text-base leading-7 text-slate-600">
            <p>
              Our mission is simple:
              <br />
              <span className="font-semibold text-slate-950">
                Make useful work easier.
              </span>
            </p>
            <p>We aim to:</p>
            <ul className="space-y-3 text-slate-700">
              <li>Build tools that solve real problems</li>
              <li>Share knowledge that drives better decisions</li>
              <li>
                Help teams and individuals work faster and more efficiently
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Founder
          </h2>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <Image
              src={blogAuthor.image}
              alt={blogAuthor.name}
              width={112}
              height={112}
              className="h-28 w-28 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Arjit Jaiswal
              </h3>
              <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
                Founder of TheSaaSBook
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Arjit builds tools and writes about SaaS growth, productivity,
                and practical workflows. The focus is always on simplicity,
                usability, and creating solutions that people can rely on daily.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Why TheSaaSBook
          </h2>
          <div className="mt-6 space-y-5 text-base leading-7 text-slate-600">
            <p>TheSaaSBook is built with a clear philosophy:</p>
            <ul className="space-y-3 text-slate-700">
              <li>Keep things simple - no unnecessary complexity</li>
              <li>
                Focus on usefulness - every tool and guide serves a purpose
              </li>
              <li>
                Move fast - designed for people who value speed and efficiency
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm shadow-slate-300/30 sm:p-10">
          <h2 className="text-3xl font-semibold tracking-tight">
            Get Started
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Explore the latest tools or dive into practical guides designed to
            help you work smarter and grow faster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Explore Tools
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
            >
              Read the Blog
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
