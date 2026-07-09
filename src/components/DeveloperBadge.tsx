export function DeveloperBadge() {
  return (
    <a
      href="https://jaswinder.info/"
      target="_blank"
      rel="noopener noreferrer author"
      aria-label="Built by Jaswinder Singh — jaswinder.info"
      className="group fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300 shadow-lg ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:bottom-6 sm:left-6"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-[10px] font-semibold text-black">
        JS
      </span>
      <span className="hidden sm:inline">Built by Jaswinder Singh</span>
      <span className="sm:hidden">Built by JS</span>
      <ArrowUpRight aria-hidden />
    </a>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
    >
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}
