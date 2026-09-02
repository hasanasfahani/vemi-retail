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
  COUNTRIES,
  DEFAULT_DIAL,
  PORTAL_ENTRY,
  formatPhone,
  grantAccess,
  submitAccessRequest,
  validateAll,
  validateField,
  type AccessRequest,
  type FieldName,
} from "@/lib/demoAccess";

type Phase = "form" | "provisioning" | "ready";

const EMPTY: AccessRequest = {
  fullName: "",
  email: "",
  dialCode: DEFAULT_DIAL,
  phone: "",
  company: "",
};

/* Shown one after another while the workspace is prepared. */
const STEPS = [
  "Verifying your work domain",
  "Preparing your workspace",
  "Loading Erbil coverage",
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
    const next = name === "phone" ? formatPhone(value) : value;
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
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      company: true,
      dialCode: true,
    });
    if (Object.keys(found).length > 0) {
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
      });
    } finally {
      window.clearInterval(ticker);
    }
    grantAccess(form);
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6"
      style={{ background: "rgba(20,21,26,0.42)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-title"
        className="panel-in surface my-auto w-full max-w-[440px] rounded-b-none sm:rounded-b-[18px]"
      >
        {phase === "form" && (
          <form onSubmit={onSubmit} noValidate>
            <div className="flex items-start justify-between gap-4 border-b border-line px-7 pb-5 pt-6">
              <div>
                <span className="t-eyebrow">Platform access</span>
                <h2 id="access-title" className="t-h3 mt-2">
                  Request a Demo
                </h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  Tell us where you sell and we&apos;ll open the live Erbil
                  workspace for you.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 px-7 py-6">
              <Field
                label="Full name"
                name="fullName"
                value={form.fullName}
                error={errors.fullName}
                autoComplete="name"
                placeholder="Ahmed Al-Rashid"
                inputRef={firstFieldRef}
                onChange={setField}
                onBlur={blurField}
              />

              <Field
                label="Work email"
                name="email"
                type="email"
                value={form.email}
                error={errors.email}
                autoComplete="email"
                placeholder="you@company.com"
                onChange={setField}
                onBlur={blurField}
              />

              {/* phone — dial code + national number */}
              <div>
                <label
                  htmlFor="access-phone"
                  className="mb-1.5 block text-[13px] font-semibold text-ink-900"
                >
                  Phone
                </label>
                <div
                  className="flex items-stretch overflow-hidden rounded-[10px] border bg-white transition-colors focus-within:border-violet"
                  style={{
                    borderColor: errors.phone
                      ? "var(--color-critical)"
                      : "var(--color-line-strong)",
                  }}
                >
                  <select
                    name="dialCode"
                    aria-label="Country dialling code"
                    value={form.dialCode}
                    onChange={(e) => setField("dialCode", e.target.value)}
                    className="mono cursor-pointer border-r border-line bg-canvas py-2.5 pl-3 pr-2 text-sm font-semibold text-ink-900 outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.dial}>
                        {c.code} {c.dial}
                      </option>
                    ))}
                  </select>
                  <input
                    id="access-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="770 123 4567"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    onBlur={() => blurField("phone")}
                    aria-invalid={Boolean(errors.phone)}
                    className="mono w-full px-3 py-2.5 text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                  />
                </div>
                <FieldError message={errors.phone} />
              </div>

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

              <Field
                label="Company"
                name="company"
                value={form.company}
                error={errors.company}
                autoComplete="organization"
                placeholder="Your company"
                onChange={setField}
                onBlur={blurField}
              />
            </div>

            <div className="border-t border-line px-7 py-5">
              <button type="submit" className="btn-primary w-full">
                Open my workspace
              </button>
              <p className="mt-3 text-center text-xs text-ink-400">
                We use your details to configure coverage — no marketing lists.
              </p>
            </div>
          </form>
        )}

        {phase !== "form" && (
          <div className="px-7 py-12 text-center" aria-live="polite">
            {phase === "provisioning" ? (
              <>
                <Spinner />
                <p className="t-h3 mt-6">Setting up your workspace</p>
                <p className="mt-1.5 h-5 text-sm text-ink-500">{STEPS[step]}</p>
              </>
            ) : (
              <>
                <CheckMark />
                <p className="t-h3 mt-6">
                  {firstName ? `You're in, ${firstName}` : "You're in"}
                </p>
                <p className="mt-1.5 text-sm text-ink-500">
                  Taking you to Erbil coverage…
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  name,
  value,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputRef,
  onChange,
  onBlur,
}: {
  label: string;
  name: FieldName;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
}) {
  const id = `access-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-ink-900"
      >
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className="w-full rounded-[10px] border bg-white px-3 py-2.5 text-[15px] text-ink-900 outline-none transition-colors focus:border-violet placeholder:text-ink-400"
        style={{
          borderColor: error
            ? "var(--color-critical)"
            : "var(--color-line-strong)",
        }}
      />
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1.5 text-[13px] font-medium"
      style={{ color: "var(--color-critical)" }}
    >
      {message}
    </p>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 44 44"
      className="mx-auto h-11 w-11 animate-spin"
      style={{ animationDuration: "900ms" }}
      aria-hidden
    >
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-line)" strokeWidth="3" />
      <path
        d="M22 4a18 18 0 0 1 18 18"
        fill="none"
        stroke="var(--color-violet)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 44 44" className="mx-auto h-11 w-11" aria-hidden>
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-violet)" strokeWidth="3" />
      <path
        d="M14 22.5l5.5 5.5L30 17"
        fill="none"
        stroke="var(--color-violet)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
