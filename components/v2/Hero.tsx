import Image from "next/image";
import { hero, ids } from "@/lib/v2Content";

export default function Hero() {
  return (
    <section
      id={ids.top}
      className="relative isolate overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-36 md:pb-24 md:pt-44"
      style={{
        background:
          "linear-gradient(135deg, #4b30e0 0%, #6748fd 52%, #9b89ff 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 78% 16%, rgba(255,255,255,0.2), transparent 32%), radial-gradient(circle at 18% 72%, rgba(25,13,99,0.2), transparent 34%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="mx-auto max-w-[1050px] text-center">
          <h1 className="font-display text-[clamp(43px,6.6vw,88px)] font-bold leading-[0.98] tracking-[-0.055em] text-white">
            {hero.headlineLines.map((line, index) => (
              <span
                key={line}
                className={`block ${
                  index === hero.headlineLines.length - 1 ? "text-[#eeeaff]" : ""
                }`}
              >
                {line}
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-7 max-w-[690px] text-[17px] leading-7 text-white/78 sm:text-lg">
            {hero.subhead}
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href={hero.primaryCta.href}
              data-demo-cta
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[15px] font-semibold text-violet-ink shadow-[0_12px_30px_-14px_rgba(20,13,83,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-violet-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {hero.primaryCta.label}
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
              href={hero.secondaryCta.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[22px] border border-white/35 bg-white shadow-[0_36px_80px_-30px_rgba(17,10,70,0.62)] sm:mt-16 sm:rounded-[30px]">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            width={2830}
            height={1416}
            preload
            sizes="(max-width: 1320px) 100vw, 1320px"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
