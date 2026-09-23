import { footer, ids } from "@/lib/v2Content";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#111017] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
      />

      <div className="container-vemi py-12 sm:py-16">
        <div className="grid items-end gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:gap-16 lg:pb-12">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-100">
              {footer.eyebrow}
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(30px,4vw,52px)] font-bold leading-[1.02] tracking-[-0.04em] text-white">
              {footer.headline}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              {footer.body}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={footer.primaryCta.href}
              data-demo-cta
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-violet-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {footer.primaryCta.label}
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </a>
            <a
              href={footer.secondaryCta.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {footer.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="grid gap-10 py-10 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div className="max-w-sm">
            <a
              href={`#${ids.top}`}
              className="inline-flex font-display text-2xl font-bold tracking-tight text-white"
              aria-label="Vemi, back to top"
            >
              {footer.brand}
              <span className="text-[#8f79ff]">.</span>
            </a>
            <p className="mt-4 text-sm leading-6 text-white/50">{footer.tagline}</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/65">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8f79ff]" aria-hidden="true" />
              {footer.credibility}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-12">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                  {column.title}
                </span>
                <nav className="mt-4 flex flex-col gap-3" aria-label={`${column.title} links`}>
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {footer.brand}. All rights reserved.
          </span>
          <a href={`#${ids.top}`} className="font-medium text-white/50 transition-colors hover:text-white">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
