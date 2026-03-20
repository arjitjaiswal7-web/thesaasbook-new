export type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  title?: string;
  intro?: string;
  items: FAQItem[];
  className?: string;
};

export default function FAQSection({
  title = "Frequently Asked Questions",
  intro,
  items,
  className = "",
}: FAQSectionProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className={className}>
      <div className="max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h2>
        {intro ? (
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            {intro}
          </p>
        ) : null}
      </div>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <details
            key={item.question}
            className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {item.question}
              </h3>
              <span
                className="text-2xl leading-none text-slate-400 transition-transform duration-200 group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
