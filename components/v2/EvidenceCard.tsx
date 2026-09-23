import Image from "next/image";
import { trust } from "@/lib/v2Content";
import Icon from "@/components/v2/Icon";

const e = trust.evidence;

export default function EvidenceCard() {
  return (
    <article className="surface flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] border-b border-line bg-canvas">
        <Image
          src={e.image.src}
          alt={e.image.alt}
          fill
          sizes="(max-width: 1023px) 100vw, 42vw"
          className="object-cover"
          style={{ objectPosition: e.image.position }}
        />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/70 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-ink-900 shadow-sm backdrop-blur sm:left-4 sm:top-4">
          <Icon name="photo" className="h-3 w-3 text-violet-ink" />
          Source photograph
        </span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/70 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-ink-900 shadow-sm backdrop-blur sm:right-4 sm:top-4">
          <Icon name="check" className="h-3 w-3 text-good" />
          {e.status}
        </span>

        <div
          className="absolute left-[24%] top-[34%] h-[34%] w-[52%] rounded-lg border-2 border-dashed"
          style={{
            borderColor: "var(--color-violet)",
            background: "color-mix(in srgb, var(--color-violet) 9%, transparent)",
          }}
        >
          <span className="absolute -top-7 left-0 rounded bg-violet px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Brand blocks detected
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-4 pt-16 text-white sm:px-5 sm:pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">Traceable audit record</p>
          <h3 className="mt-1 font-display text-base font-bold">{e.outlet}</h3>
          <p className="mt-0.5 text-xs text-white/80">
            {e.location} · {e.channel}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-ink">AI-assisted image analysis</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink-900">{e.finding}</p>
          </div>
          <span className="pill pill-good shrink-0">
            <Icon name="check" className="h-3 w-3" />
            Verified
          </span>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {e.analysisPoints.map((point) => (
            <li key={point} className="flex items-center gap-2 rounded-lg bg-violet-050 px-3 py-2 text-xs font-medium text-violet-ink">
              <Icon name="spark" className="h-3.5 w-3.5 shrink-0" />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {e.captured}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="link" className="h-3.5 w-3.5" />
            Audit {e.auditRef}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" className="h-3.5 w-3.5" />
            Linked to dashboard
          </span>
        </div>
        <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
          Analysis overlay is illustrative; the photograph and capture metadata are field evidence.
        </p>
      </div>
    </article>
  );
}
