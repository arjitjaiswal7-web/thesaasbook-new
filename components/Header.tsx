"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import Logo from "@/components/Logo";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Tools", href: "/tools" },
  { name: "Blog", href: "/blog" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const mobileNavId = "primary-mobile-navigation";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-shadow duration-200 ${
        isScrolled ? "shadow-[0_12px_34px_-24px_rgba(15,23,42,0.45)]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="TheSaaSBook homepage"
          className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        >
          <Logo />
        </Link>

        <nav aria-label="Primary navigation" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 p-1">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                      active
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href="/tools/pdf-tools"
          className="hidden items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 md:inline-flex"
        >
          Open PDF Tools
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        <button
          type="button"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls={mobileNavId}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      <div
        id={mobileNavId}
        className={`border-t border-slate-200/80 bg-white md:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <nav aria-label="Mobile navigation" className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                      active
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/tools/pdf-tools"
            onClick={() => setIsMenuOpen(false)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            Open PDF Tools
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
