import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { Children, isValidElement, type ReactNode } from "react";

import { getUniqueHeadingId, resolveBlogImageSrc } from "@/lib/blog";

function extractText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement(child)) {
        return extractText((child.props as { children?: ReactNode }).children);
      }

      return "";
    })
    .join("");
}

export function createMdxComponents(): MDXComponents {
  const headingTracker = new Map<string, number>();
  const resolveHeadingId = (children: ReactNode) =>
    getUniqueHeadingId(extractText(children), headingTracker);

  return {
    h2: ({ children, ...props }) => {
      const id = resolveHeadingId(children);

      return (
        <h2
          id={id}
          className="scroll-mt-32 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = resolveHeadingId(children);

      return (
        <h3
          id={id}
          className="scroll-mt-32 text-2xl font-semibold tracking-tight text-slate-950"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = resolveHeadingId(children);

      return (
        <h4
          id={id}
          className="scroll-mt-32 text-xl font-semibold tracking-tight text-slate-950"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p: ({ children, ...props }) => (
      <p className="text-base leading-8 text-slate-700" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="space-y-3 pl-5 text-base leading-8 text-slate-700" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="space-y-3 pl-5 text-base leading-8 text-slate-700" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1 marker:text-slate-400" {...props}>
        {children}
      </li>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-sky-200 pl-5 text-slate-600" {...props}>
        {children}
      </blockquote>
    ),
    a: ({ children, href = "", ...props }) => {
      const className = "font-medium text-sky-700 underline decoration-sky-200 underline-offset-4 transition hover:text-sky-800 hover:decoration-sky-400";

      if (href.startsWith("/")) {
        return (
          <Link href={href} className={className}>
            {children}
          </Link>
        );
      }

      return (
        <a href={href} className={className} rel="noreferrer" {...props}>
          {children}
        </a>
      );
    },
    img: ({ alt = "", src = "", ...props }) => {
      const resolvedSrc = resolveBlogImageSrc(src);

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={alt}
          className="h-auto w-full max-w-full rounded-[1.5rem] border border-slate-200 object-cover shadow-sm shadow-slate-200/50"
          loading="lazy"
          {...props}
        />
      );
    },
    table: ({ children, ...props }) => (
      <div className="my-8 w-full max-w-full overflow-x-auto rounded-[1.5rem] border border-slate-200 shadow-sm shadow-slate-200/40">
        <table className="w-max min-w-full border-collapse bg-white text-left text-sm text-slate-700" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border-b border-slate-200 px-4 py-3 align-top last:border-b-0" {...props}>
        {children}
      </td>
    ),
    hr: (props) => <hr className="border-slate-200" {...props} />,
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-slate-950" {...props}>
        {children}
      </strong>
    ),
  };
}
