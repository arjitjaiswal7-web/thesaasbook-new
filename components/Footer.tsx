import Link from "next/link";

import Logo from "@/components/Logo";

const productLinks = [
  { name: "Home", href: "/" },
  { name: "Tools", href: "/tools" },
  { name: "Blog", href: "/blog" },
];

const pdfToolLinks = [
  { name: "Merge PDF", href: "/tools/pdf-tools/merge-pdf" },
  { name: "Split PDF", href: "/tools/pdf-tools/split-pdf" },
  { name: "Compress PDF", href: "/tools/pdf-tools/compress-pdf" },
];

const legalLinks = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms and Conditions", href: "/terms-and-conditions" },
  { name: "Security", href: "/security" },
];

const supportLinks = [
  { name: "About Us", href: "/about-us" },
  { name: "Contact Us", href: "/contact-us" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/95">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))]">
          <section aria-labelledby="footer-brand" className="max-w-sm">
            <div id="footer-brand">
              <Logo />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Built for founders and marketers who want faster execution and
              better signal from every page they publish.
            </p>
          </section>

          <nav aria-labelledby="footer-product">
            <h2
              id="footer-product"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900"
            >
              Product
            </h2>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-950"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-pdf-tools">
            <h2
              id="footer-pdf-tools"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900"
            >
              PDF Tools
            </h2>
            <ul className="mt-4 space-y-3">
              {pdfToolLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-950"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2
              id="footer-legal"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900"
            >
              Legal
            </h2>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-950"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-support">
            <h2
              id="footer-support"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900"
            >
              Support
            </h2>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-slate-950"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200/80 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TheSaaSBook. All rights reserved.</p>
          <p>Fast, accessible, and designed for modern SaaS workflows.</p>
        </div>
      </div>
    </footer>
  );
}
