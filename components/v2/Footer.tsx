import { footer, ids } from "@/lib/v2Content";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-vemi py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <span className="font-display text-xl font-bold text-ink-900">
              {footer.brand}
              <span style={{ color: "var(--color-violet)" }}>.</span>
            </span>
            <p className="mt-3 text-sm text-ink-500">{footer.tagline}</p>
          </div>

          <div className="flex gap-12">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <span className="t-eyebrow">{col.title}</span>
                <div className="mt-3 flex flex-col gap-2">
                  {col.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="text-sm font-medium text-ink-500 hover:text-ink-900"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-400 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {footer.brand}. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <span>{footer.credibility}</span>
            <a href={`#${ids.top}`} className="hover:text-ink-700">
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
