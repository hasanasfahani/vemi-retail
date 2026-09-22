"use client";

import { useState } from "react";
import { finalCta, leadForm, ids } from "@/lib/v2Content";
import {
  COUNTRIES,
  DEFAULT_DIAL,
  formatPhone,
  validateAll,
  validateField,
  submitAccessRequest,
  type AccessRequest,
  type FieldName,
} from "@/lib/demoAccess";
import Icon from "@/components/v2/Icon";

/* §16 + §17 as one conversion block. The two calls to action are the
   request-type selector rather than two separate buttons — that is what
   they actually mean, and it puts the answer straight into the lead.

   Capture reuses the portal's access-request pipeline. It deliberately
   does NOT call grantAccess: this is a demo request, not provisioning. */

type Extra = { industry: string; question: string };
type AllErrors = Partial<Record<FieldName | keyof Extra, string>>;

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-violet/20";

function cls(err?: string) {
  return `${inputBase} ${err ? "border-critical" : "border-line focus:border-violet"}`;
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function RequestSection() {
  const [requestType, setRequestType] = useState(finalCta.primary.interest);
  const [form, setForm] = useState<AccessRequest>({
    fullName: "",
    email: "",
    dialCode: DEFAULT_DIAL,
    phone: "",
    company: "",
  });
  const [extra, setExtra] = useState<Extra>({ industry: "", question: "" });
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<AllErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const setF = (k: FieldName, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validateExtras = (): AllErrors => {
    const e: AllErrors = {};
    if (!extra.industry) e.industry = "Please choose your industry.";
    if (extra.question.trim().length < 5)
      e.question = "Tell us briefly what you need to understand.";
    return e;
  };

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const all: AllErrors = { ...validateAll(form), ...validateExtras() };
    const clean = Object.fromEntries(
      Object.entries(all).filter(([, v]) => Boolean(v))
    ) as AllErrors;

    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      return;
    }

    setStatus("sending");
    await submitAccessRequest(form, {
      source: "v2 lead form",
      referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
      company_role: honey,
      requestType,
      industry: extra.industry,
      question: extra.question,
    });
    setStatus("done");
  }

  return (
    <section id={ids.request} className="section">
      <div className="container-vemi">
        <div className="overflow-hidden rounded-3xl border border-line bg-canvas">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            {/* §16 — the ask */}
            <div className="border-b border-line p-8 sm:p-10 lg:border-b-0 lg:border-r">
              <h2 className="t-h2 !text-[clamp(28px,3.4vw,40px)]">{finalCta.headline}</h2>
              <p className="t-lead mt-4">{finalCta.subhead}</p>

              <div className="mt-8">
                <span className="t-eyebrow">What would you like?</span>
                <div className="mt-3 flex flex-col gap-2.5">
                  {[finalCta.primary, finalCta.secondary].map((c) => {
                    const on = requestType === c.interest;
                    return (
                      <button
                        key={c.interest}
                        type="button"
                        onClick={() => setRequestType(c.interest)}
                        aria-pressed={on}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          on ? "border-violet bg-violet-050" : "border-line bg-white hover:border-line-strong"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            on ? "border-violet" : "border-line-strong"
                          }`}
                        >
                          {on && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: "var(--color-violet)" }}
                            />
                          )}
                        </span>
                        <span className={`text-sm font-semibold ${on ? "text-violet-ink" : "text-ink-900"}`}>
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="mt-8 flex items-start gap-2 text-xs text-ink-500">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
                {leadForm.subhead}
              </p>
            </div>

            {/* §17 — the form */}
            <div className="p-8 sm:p-10">
              {status === "done" ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--color-good) 14%, #fff)" }}
                  >
                    <Icon name="check" className="h-6 w-6" />
                  </span>
                  <h3 className="t-h3 mt-4 !text-xl">{leadForm.success.title}</h3>
                  <p className="mt-2 max-w-sm text-sm text-ink-500">{leadForm.success.body}</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <span className="t-eyebrow">{leadForm.eyebrow}</span>
                  <h3 className="t-h3 mt-2 !text-xl">{leadForm.headline}</h3>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="v2-name" error={errors.fullName}>
                      <input
                        id="v2-name"
                        className={cls(errors.fullName)}
                        value={form.fullName}
                        onChange={(e) => setF("fullName", e.target.value)}
                        onBlur={(e) =>
                          setErrors((x) => ({ ...x, fullName: validateField("fullName", e.target.value) ?? undefined }))
                        }
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </Field>

                    <Field label="Company" htmlFor="v2-company" error={errors.company}>
                      <input
                        id="v2-company"
                        className={cls(errors.company)}
                        value={form.company}
                        onChange={(e) => setF("company", e.target.value)}
                        onBlur={(e) =>
                          setErrors((x) => ({ ...x, company: validateField("company", e.target.value) ?? undefined }))
                        }
                        placeholder="Company name"
                        autoComplete="organization"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Work email" htmlFor="v2-email" error={errors.email}>
                        <input
                          id="v2-email"
                          type="email"
                          className={cls(errors.email)}
                          value={form.email}
                          onChange={(e) => setF("email", e.target.value)}
                          onBlur={(e) =>
                            setErrors((x) => ({ ...x, email: validateField("email", e.target.value) ?? undefined }))
                          }
                          placeholder="you@company.com"
                          autoComplete="email"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field label="Phone" htmlFor="v2-phone" error={errors.phone}>
                        <div className="flex gap-2">
                          <select
                            aria-label="Country dial code"
                            className={`${cls()} w-28 shrink-0`}
                            value={form.dialCode}
                            onChange={(e) => setF("dialCode", e.target.value)}
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.dial}>
                                {c.code} {c.dial}
                              </option>
                            ))}
                          </select>
                          <input
                            id="v2-phone"
                            inputMode="tel"
                            className={cls(errors.phone)}
                            value={form.phone}
                            onChange={(e) => setF("phone", formatPhone(e.target.value))}
                            onBlur={(e) =>
                              setErrors((x) => ({
                                ...x,
                                phone: validateField("phone", e.target.value, form) ?? undefined,
                              }))
                            }
                            placeholder="770 123 4567"
                            autoComplete="tel"
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field label="Industry" htmlFor="v2-industry" error={errors.industry}>
                        <select
                          id="v2-industry"
                          className={cls(errors.industry)}
                          value={extra.industry}
                          onChange={(e) => {
                            setExtra((x) => ({ ...x, industry: e.target.value }));
                            setErrors((x) => ({ ...x, industry: undefined }));
                          }}
                        >
                          <option value="">Select your industry</option>
                          {leadForm.industries.map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field
                        label="What do you want to understand?"
                        htmlFor="v2-question"
                        error={errors.question}
                      >
                        <textarea
                          id="v2-question"
                          rows={3}
                          className={`${cls(errors.question)} resize-none`}
                          value={extra.question}
                          onChange={(e) => {
                            setExtra((x) => ({ ...x, question: e.target.value }));
                            if (errors.question) setErrors((x) => ({ ...x, question: undefined }));
                          }}
                          placeholder="e.g. Our shelf share in Baghdad supermarkets, and who is taking our facings."
                        />
                      </Field>
                    </div>
                  </div>

                  {/* honeypot — visually and semantically hidden */}
                  <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
                    <label htmlFor="company_role">Company role</label>
                    <input
                      id="company_role"
                      name="company_role"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honey}
                      onChange={(e) => setHoney(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn-primary mt-6 w-full disabled:opacity-70"
                  >
                    {status === "sending" ? "Sending…" : leadForm.submitLabel}
                  </button>

                  <p className="mt-3 text-center text-xs text-ink-400">
                    We use your details only to respond to this request.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
