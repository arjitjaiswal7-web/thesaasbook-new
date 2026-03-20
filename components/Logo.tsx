"use client";

import Image from "next/image";
import { useState } from "react";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

export default function Logo({
  className = "",
  iconClassName = "",
  textClassName = "",
}: LogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <span
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 ${iconClassName}`.trim()}
      >
        {imageFailed ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-slate-950"
            aria-hidden="true"
          >
            <path d="M12 3 5.5 5.8v5.8c0 4.3 2.8 8.2 6.5 9.4 3.7-1.2 6.5-5.1 6.5-9.4V5.8L12 3Z" />
            <path d="M9.3 8.5h4.7l2 2v5H9.3z" />
            <path d="M14 8.5v2h2" />
            <path d="M10.7 13h4.6" />
            <path d="M10.7 15.5h3.2" />
          </svg>
        ) : (
          <Image
            src="/logo.png"
            alt="TheSaaSBook logo"
            width={44}
            height={44}
            className="h-full w-full object-cover"
            priority
            onError={() => setImageFailed(true)}
          />
        )}
      </span>
      <span
        className={`text-base font-semibold tracking-tight text-slate-950 sm:text-lg ${textClassName}`.trim()}
      >
        TheSaaSBook
      </span>
    </div>
  );
}
