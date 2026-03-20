import type { TableOfContentsItem } from "@/lib/blog";

type TableOfContentsProps = {
  items: TableOfContentsItem[];
  className?: string;
};

function TableOfContentsList({ items }: { items: TableOfContentsItem[] }) {
  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 ${
                item.level === 3 ? "pl-7" : ""
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function TableOfContents({ items, className }: TableOfContentsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <aside className={className}>
      <details className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 lg:hidden">
        <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-slate-950">
          Table of Contents
        </summary>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <TableOfContentsList items={items} />
        </div>
      </details>

      <div className="hidden lg:block lg:sticky lg:top-28">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Table of Contents
          </h2>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <TableOfContentsList items={items} />
          </div>
        </div>
      </div>
    </aside>
  );
}
