import { footer, placeholders } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-vemi py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <span className="font-display text-xl font-bold text-ink-900">
              {footer.brand}
              <span style={{ color: "var(--color-violet)" }}>.</span>
            </span>
            <p className="mt-3 text-sm text-ink-500">{footer.tagline}</p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footer.navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-500 hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex gap-2">
            <a
              href={placeholders.linkedin}
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-500 transition-colors hover:border-line-strong hover:text-ink-900"
            >
              in
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-ink-400 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {footer.brand}. All rights reserved.
          </span>
          <span>{footer.credibility}</span>
        </div>
      </div>
    </footer>
  );
}
