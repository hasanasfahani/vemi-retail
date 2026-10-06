import { footer, ids } from "@/lib/v2Content";
import { Logo } from "@/components/vemi/Logo";
import { SignalField } from "@/components/vemi/SignalField";
import Icon from "@/components/vemi/Icon";

/* The close (brand refresh, phase 7). A Violet band set like a report
   cover — white signal field at 14%, mono eyebrow, white headline, a
   white button — then the Ink footer on the dark token set, so every
   colour below comes from the tokens rather than white-at-some-alpha. */

const onViolet =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:shadow-none";

export default function Footer() {
  return (
    <footer>
      <section className="relative isolate overflow-hidden bg-primary text-white" aria-labelledby="closing-title">
        <SignalField
          colorway="violet"
          fadeFrom="right"
          cols={16}
          rows={9}
          seed={5}
          className="absolute right-0 top-0 -z-10 hidden h-full w-[38%] lg:block"
        />
        <div className="container-vemi py-16 sm:py-20">
          <div className="max-w-xl">
            <span className="vm-label !text-white">{footer.eyebrow}</span>
            <h2
              id="closing-title"
              className="mt-4 text-[36px] font-semibold leading-[44px] tracking-[-0.02em] sm:text-[44px] sm:leading-[52px]"
            >
              {footer.headline}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-6 sm:text-lg sm:leading-7">{footer.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={footer.primaryCta.href}
                data-demo-cta
                className={`vm-btn bg-surface !text-primary-text hover:bg-primary-tint ${onViolet}`}
              >
                {footer.primaryCta.label}
                <Icon name="arrow-right" size={16} />
              </a>
              <a
                href={footer.secondaryCta.href}
                className={`vm-btn border-white/70 bg-transparent text-white hover:bg-white/10 ${onViolet}`}
              >
                {footer.secondaryCta.label}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div data-theme="dark" className="bg-surface text-text">
        <div className="container-vemi">
          <div className="grid gap-10 py-14 md:grid-cols-[1.3fr_1fr] md:gap-16">
            <div className="max-w-sm">
              <a href={`#${ids.top}`} className="inline-flex rounded-sm" aria-label="Vemi, back to top">
                <Logo height={32} tone="onInk" title="" />
              </a>
              <p className="mt-5 text-sm leading-6 text-text-muted">{footer.tagline}</p>
              <address className="mt-5 flex flex-col gap-1 font-mono text-xs not-italic text-text-muted">
                {footer.offices.map((office) => (
                  <span key={office.location}>
                    {office.location},{" "}
                    <a href={`tel:${office.phone}`} className="hover:text-text">
                      {office.phone}
                    </a>
                  </span>
                ))}
                <span>
                  Contact email:{" "}
                  <a href={`mailto:${footer.email}`} className="hover:text-text">
                    {footer.email}
                  </a>
                </span>
              </address>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:gap-12">
              {footer.columns.map((column) => (
                <div key={column.title}>
                  <span className="vm-label">{column.title}</span>
                  <nav className="mt-3 flex flex-col" aria-label={`${column.title} links`}>
                    {column.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="flex min-h-10 items-center text-sm font-medium text-text underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line py-5 font-mono text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {footer.brand}. All rights reserved.
            </span>
            <a href={`#${ids.top}`} className="inline-flex min-h-10 items-center hover:text-text">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
