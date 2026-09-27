"use client";

/* ============================================================
   Access request — the gate in front of the live portal.

   Mounted once in the root layout. Opens on a click of any element
   carrying `data-demo-cta`, so the marketing sections stay server
   components and keep their plain anchors as the no-JS fallback.
   ============================================================ */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_DIAL,
  PORTAL_ENTRY,
  grantAccess,
  submitAccessRequest,
  validateAll,
  validateField,
  type AccessRequest,
  type FieldName,
} from "@/lib/demoAccess";
import { leadForm } from "@/lib/v2Content";
import { Mark } from "@/components/vemi/Logo";
import Icon from "@/components/vemi/Icon";
import { TextField, SelectField } from "@/components/vemi/Field";

type Phase = "form" | "provisioning" | "ready";

const EMPTY: AccessRequest = {
  fullName: "",
  email: "",
  dialCode: DEFAULT_DIAL,
  phone: "",
  company: "",
};

/* Shown one after another while the dashboard opens.

   These describe what the product is loading — not work being done on
   this visitor's own data. The dashboard is a live demonstration
   environment, so wording like "preparing your workspace" or
   "tailoring your dashboard" would promise something personalised that
   the visitor is not about to receive. */
const STEPS = [
  "Verifying your details",
  "Loading store coverage",
  "Preparing availability and shelf views",
];

/* The portal guard redirects to `/?access=1`. Treat that flag as
   external state rather than syncing it into an effect, so the panel
   is open on the first client render. */
const urlListeners = new Set<() => void>();

function subscribeUrl(onChange: () => void) {
  urlListeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    urlListeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function guardParamPresent() {
  return new URLSearchParams(window.location.search).has("access");
}

function clearGuardParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("access")) return;
  url.searchParams.delete("access");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  urlListeners.forEach((cb) => cb());
}

export default function AccessRequestModal() {
  const router = useRouter();
  const [openedByClick, setOpenedByClick] = useState(false);
  const guardRequested = useSyncExternalStore(
    subscribeUrl,
    guardParamPresent,
    () => false
  );
  const open = openedByClick || guardRequested;
  const setOpen = setOpenedByClick;
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<AccessRequest>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [step, setStep] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  /* Industry is not part of AccessRequest, so it carries its own error. */
  const [industryError, setIndustryError] = useState<string | undefined>();

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  /* ---------- open / close ---------- */
  const close = useCallback(() => {
    if (phase === "provisioning") return; // don't interrupt provisioning
    setOpen(false);
    clearGuardParam();
    openerRef.current?.focus();
  }, [phase, setOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-demo-cta]"
      );
      if (!target) return;
      e.preventDefault();
      openerRef.current = target;
      setPhase("form");
      setForm(EMPTY);
      setErrors({});
      setTouched({});
      setStep(0);
      setHoneypot("");
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [setOpen]);

  /* Escape to dismiss, and keep tabbing inside the panel. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, a[href], [tabindex]'
        )
        // Skip the honeypot and anything else deliberately out of the cycle.
      ).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* Lock the page behind the panel. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(t);
    };
  }, [open]);

  /* ---------- field handling ---------- */
  const setField = (name: FieldName, value: string) => {
    /* The phone field is one international number now that the dial-code
       select is gone, so it is stored exactly as typed. formatPhone used
       to run here and stripped the leading "+", after which the endpoint
       prepended the dial code again and the record read "+964 964 770…".
       Matches the pricing form, which has never formatted. */
    const next = value;
    setForm((f) => ({ ...f, [name]: next }));
    // Only re-validate live once a field has been left once — no
    // shouting at someone mid-keystroke.
    if (touched[name]) {
      setErrors((e) => ({
        ...e,
        [name]: validateField(name, next, { ...form, [name]: next }) ?? undefined,
      }));
    }
  };

  const blurField = (name: FieldName) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((e) => ({
      ...e,
      [name]: validateField(name, form[name], form) ?? undefined,
    }));
  };

  /* ---------- submit ---------- */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateAll(form);
    setErrors(found);

    const badIndustry = !industry
      ? "Please choose your industry."
      : industry === "Other" && !customIndustry.trim()
        ? "Please enter your industry."
        : undefined;
    setIndustryError(badIndustry);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      company: true,
      dialCode: true,
    });
    if (Object.keys(found).length > 0 || badIndustry) {
      const firstBad = (
        ["fullName", "email", "phone", "company"] as FieldName[]
      ).find((k) => found[k]);
      if (firstBad) {
        panelRef.current
          ?.querySelector<HTMLInputElement>(`[name="${firstBad}"]`)
          ?.focus();
      }
      return;
    }

    setPhase("provisioning");
    const ticker = window.setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      440
    );
    try {
      await submitAccessRequest(form, {
        source: window.location.pathname + window.location.hash,
        referrer: document.referrer || "direct",
        company_role: honeypot,
        industry: industry === "Other" ? customIndustry.trim() : industry,
      });
    } finally {
      window.clearInterval(ticker);
    }
    grantAccess(form, { industry: industry === "Other" ? customIndustry.trim() : industry });
    setPhase("ready");
    window.setTimeout(() => {
      router.push(PORTAL_ENTRY);
      // Drop the panel once the portal has the route — otherwise the
      // confirmation lingers on top of the workspace.
      window.setTimeout(() => setOpen(false), 350);
    }, 900);
  };

  if (!open) return null;

  const firstName = form.fullName.trim().split(/\s+/)[0];

  const fieldProps = (name: FieldName) => ({
    id: `access-${name}`,
    name,
    value: form[name],
    error: errors[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, e.target.value),
    onBlur: () => blurField(name),
  });

  return (
    <div
      className="vm-dialog-wrap !z-[100]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="vm-scrim" aria-hidden="true" onMouseDown={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-title"
        className="vm-dialog max-w-[560px]"
      >
        {phase === "form" && (
          <form onSubmit={onSubmit} noValidate>
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <Mark size={24} title="" />
                <span className="vm-label mt-5 block text-primary-text">Platform access</span>
                <h2 id="access-title" className="vm-dialog__title mt-2">
                  Explore the dashboard
                </h2>
                <p className="mt-2 text-[15px] leading-[22px] text-text-muted">
                  Add your details to open the Vemi dashboard and see how
                  availability, shelf share and competitor activity are
                  tracked.
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="vm-iconbtn -me-2 -mt-2 shrink-0">
                <Icon name="close" />
              </button>
            </div>

            {/* Same contact block as the pricing section: name, company,
                work email, then one phone field. The dial-code select was
                dropped because the placeholder already shows the expected
                format and a wide select beside a cramped input was hard to
                type into. `dialCode` stays in state as a fallback — the
                endpoint only prepends it when the number has no "+". */}
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <TextField
                label="Full name"
                ref={firstFieldRef}
                autoComplete="name"
                placeholder="Your name"
                {...fieldProps("fullName")}
              />
              <TextField
                label="Company"
                autoComplete="organization"
                placeholder="Company name"
                {...fieldProps("company")}
              />
              <TextField
                className="sm:col-span-2"
                label="Work email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...fieldProps("email")}
              />
              <TextField
                className="sm:col-span-2"
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. +964 770 123 4567"
                {...fieldProps("phone")}
              />

              {/* Industry, matching the pricing form — it is the one
                  qualifying answer sales needs before the call. */}
              <SelectField
                className="sm:col-span-2"
                label="Industry"
                id="access-industry"
                name="industry"
                value={industry}
                error={industry === "Other" ? undefined : industryError}
                onChange={(e) => {
                  const value = e.target.value;
                  setIndustry(value);
                  if (value !== "Other") setCustomIndustry("");
                  setIndustryError(undefined);
                }}
              >
                <option value="">Select your industry</option>
                {leadForm.industries.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>

              {industry === "Other" && (
                <TextField
                  className="sm:col-span-2"
                  label="Specify your industry"
                  id="access-custom-industry"
                  value={customIndustry}
                  maxLength={100}
                  error={industryError}
                  onChange={(e) => {
                    setCustomIndustry(e.target.value);
                    setIndustryError(undefined);
                  }}
                  placeholder="Enter your industry"
                />
              )}

              {/* Honeypot — off-screen and out of the tab order. Only a
                  bot fills it, and the endpoint drops anything that does. */}
              <input
                type="text"
                name="company_role"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-9999px] h-px w-px opacity-0"
              />
            </div>

            <div className="border-t border-line px-6 py-5">
              <button type="submit" className="vm-btn vm-btn--primary vm-btn--block">
                Open the dashboard
              </button>
              <p className="mt-3 text-sm leading-5 text-text-muted">
                We&apos;ll only use your details to follow up about Vemi.
              </p>
            </div>
          </form>
        )}

        {phase !== "form" && (
          <div className="px-6 py-10" aria-live="polite">
            <Mark size={24} title="" />
            {phase === "provisioning" ? (
              <>
                <p className="vm-dialog__title mt-5">Opening the dashboard</p>
                <ol className="mt-6 space-y-3 font-mono text-sm">
                  {STEPS.map((label, i) => {
                    const state = i < step ? "done" : i === step ? "now" : "next";
                    return (
                      <li
                        key={label}
                        className={`flex items-center gap-3 ${state === "next" ? "text-text-muted" : "text-text"}`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                          {state === "done" ? (
                            <Icon name="check" size={16} className="text-primary-text" />
                          ) : state === "now" ? (
                            <Spinner />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                          )}
                        </span>
                        {label}
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <>
                <p className="vm-dialog__title mt-5">
                  {firstName ? `You're in, ${firstName}` : "You're in"}
                </p>
                <p className="mt-2 font-mono text-sm text-text-muted">Opening the dashboard…</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Spinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      style={{ animationDuration: "900ms" }}
      aria-hidden
    >
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="var(--vm-line)" strokeWidth="2" />
      <path d="M10 2.5a7.5 7.5 0 0 1 7.5 7.5" fill="none" stroke="var(--vm-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
