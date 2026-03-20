import Image from "next/image";

import { blogAuthor } from "@/lib/blog";

type AuthorProfileProps = {
  className?: string;
};

export default function AuthorProfile({ className = "" }: AuthorProfileProps) {
  return (
    <section
      className={`rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/50 sm:p-7 ${className}`.trim()}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Image
          src={blogAuthor.image}
          alt={blogAuthor.name}
          width={88}
          height={88}
          className="h-[5.5rem] w-[5.5rem] rounded-full border border-slate-200 object-cover"
        />
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {blogAuthor.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-sky-700">{blogAuthor.role}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{blogAuthor.bio}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-sky-700">
            <a href={blogAuthor.website} className="transition hover:text-sky-800">
              Website
            </a>
            <span className="text-slate-300" aria-hidden="true">
              |
            </span>
            <a href={blogAuthor.linkedin} className="transition hover:text-sky-800">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
