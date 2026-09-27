import Image from "next/image";
import { trust } from "@/lib/v2Content";
import Icon from "@/components/vemi/Icon";
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";

const e = trust.evidence;

/* One audit record, evidence first: the photograph, then its capture
   metadata as a mono strip, then what was read from it. No gradient
   over the photo and no glass: anything on the image sits on a solid
   panel (brand rule). The analysis overlay is marked illustrative. */
export default function EvidenceCard() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      <div className="relative aspect-[16/10] bg-canvas">
        <Image
          src={e.image.src}
          alt={e.image.alt}
          fill
          sizes="(max-width: 1023px) 100vw, 42vw"
          className="object-cover"
          style={{ objectPosition: e.image.position }}
        />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-sm bg-white px-2.5 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.08em] text-ink-900 sm:left-4 sm:top-4">
          <Icon name="photo" size={16} className="h-3.5 w-3.5 text-primary" />
          Source photograph
        </span>

        <div className="absolute left-[24%] top-[34%] h-[34%] w-[52%] rounded-md border-2 border-dashed border-primary">
          <span className="absolute -top-8 left-0 rounded-sm bg-primary px-2 py-1 font-mono text-xs font-medium uppercase tracking-[0.08em] text-white">
            Brand blocks detected
          </span>
        </div>
      </div>

      {/* the capture record, as data */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line bg-canvas px-5 py-3 sm:px-6">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-ink-900">
          ERB-204 · {e.captured} · Geo-tagged
        </p>
        <ConfidenceBadge level="measured" size="sm">{e.status}</ConfidenceBadge>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-ink-900">{e.outlet}</h3>
        <p className="text-sm text-ink-500">
          {e.location} · {e.channel}
        </p>

        <p className="vm-label mt-5">AI-assisted image analysis</p>
        <p className="mt-1 text-base font-semibold text-ink-900">{e.finding}</p>

        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {e.analysisPoints.map((point) => (
            <li key={point} className="flex items-center gap-2 rounded-md bg-primary-tint px-3 py-2 text-sm font-medium text-primary-text">
              <Icon name="spark" size={16} />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 pt-4 font-mono text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="link" size={16} className="h-3.5 w-3.5" />
            Audit {e.auditRef}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" size={16} className="h-3.5 w-3.5" />
            Linked to the dashboard
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-500">
          The analysis overlay is illustrative; the photograph and capture metadata are field evidence.
        </p>
      </div>
    </article>
  );
}
