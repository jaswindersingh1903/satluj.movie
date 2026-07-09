import { faq } from "@/lib/faq";

export function Faq() {
  return (
    <section
      id="faq"
      aria-label="Frequently asked questions"
      className="flex flex-col gap-5 border-t border-white/5 pt-8"
    >
      <div>
        <h2 className="text-lg font-medium text-zinc-200">
          Frequently asked questions
        </h2>
        <p className="text-xs text-zinc-500">
          About Satluj, Jaswant Singh Khalra, and how to watch.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {faq.map((item, idx) => (
          <details
            key={item.q}
            className="group rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10 open:bg-white/10"
            open={idx === 0}
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-zinc-100 [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="text-zinc-400 transition group-open:rotate-180"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
