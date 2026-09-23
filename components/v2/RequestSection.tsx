"use client";

import { useState } from "react";
import { finalCta, leadForm, quoteScope, ids } from "@/lib/v2Content";
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

type QuoteScope = {
  posPerMonth: number;
  categories: number;
  cities: number;
};

type AllErrors = Partial<Record<FieldName, string>>;

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
      {error ? (
        <p className="mt-1 text-xs" style={{ color: "var(--color-critical)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ScopeRange({
  id,
  label,
  value,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  valueLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  valueLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-ink-900">
          {label}
        </label>
        <output
          htmlFor={id}
          className="min-w-20 rounded-lg bg-violet-050 px-3 py-1.5 text-center font-display text-base font-bold text-violet-ink"
        >
          {valueLabel}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-5 h-2 w-full cursor-pointer [accent-color:var(--color-violet)]"
      />
      <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-400">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export default function RequestSection() {
  const [form, setForm] = useState<AccessRequest>({
    fullName: "",
    email: "",
    dialCode: DEFAULT_DIAL,
    phone: "",
    company: "",
  });
  const [scope, setScope] = useState<QuoteScope>({
    posPerMonth: quoteScope.posPerMonth.initial,
    categories: quoteScope.categories.initial,
    cities: quoteScope.cities.initial,
  });
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<AllErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const setF = (key: FieldName, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = Object.fromEntries(
      Object.entries(validateAll(form)).filter(([, value]) => Boolean(value))
    ) as AllErrors;

    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      return;
    }

    setStatus("sending");
    await submitAccessRequest(form, {
      source: "v2 pricing quotation",
      referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
      company_role: honey,
      requestType: "Pricing quotation",
      posPerMonth: scope.posPerMonth,
      categories: scope.categories,
      cities: scope.cities,
    });
    setStatus("done");
  }

  return (
    <section id={ids.request} className="section">
      <div className="container-vemi">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-surface)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-line bg-canvas p-8 sm:p-10 lg:border-b-0 lg:border-r">
              <span className="t-eyebrow">{finalCta.eyebrow}</span>
              <h2 className="t-h2 mt-3 !text-[clamp(30px,3.6vw,44px)]">{finalCta.headline}</h2>
              <p className="t-lead mt-4">{finalCta.subhead}</p>

              <div className="mt-8 space-y-4">
                <ScopeRange
                  id="quote-pos"
                  label={quoteScope.posPerMonth.label}
                  value={scope.posPerMonth}
                  min={quoteScope.posPerMonth.min}
                  max={quoteScope.posPerMonth.max}
                  step={quoteScope.posPerMonth.step}
                  minLabel={quoteScope.posPerMonth.minLabel}
                  maxLabel={quoteScope.posPerMonth.maxLabel}
                  valueLabel={scope.posPerMonth.toLocaleString("en-US")}
                  onChange={(value) =>
                    setScope((current) => ({ ...current, posPerMonth: value }))
                  }
                />
                <ScopeRange
                  id="quote-categories"
                  label={quoteScope.categories.label}
                  value={scope.categories}
                  min={quoteScope.categories.min}
                  max={quoteScope.categories.max}
                  step={quoteScope.categories.step}
                  minLabel={quoteScope.categories.minLabel}
                  maxLabel={quoteScope.categories.maxLabel}
                  valueLabel={`${scope.categories} / ${quoteScope.categories.max}`}
                  onChange={(value) =>
                    setScope((current) => ({ ...current, categories: value }))
                  }
                />
                <ScopeRange
                  id="quote-cities"
                  label={quoteScope.cities.label}
                  value={scope.cities}
                  min={quoteScope.cities.min}
                  max={quoteScope.cities.max}
                  step={quoteScope.cities.step}
                  minLabel={quoteScope.cities.minLabel}
                  maxLabel={quoteScope.cities.maxLabel}
                  valueLabel={`${scope.cities} / ${quoteScope.cities.max}`}
                  onChange={(value) =>
                    setScope((current) => ({ ...current, cities: value }))
                  }
                />
              </div>

              <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-ink-500">
                <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
                {leadForm.subhead}
              </p>
            </div>

            <div className="p-8 sm:p-10">
              {status === "done" ? (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
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
                  <h3 className="t-h3 mt-2 !text-2xl">{leadForm.headline}</h3>
                  <p className="mt-2 text-sm text-ink-500">{leadForm.intro}</p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="v2-name" error={errors.fullName}>
                      <input
                        id="v2-name"
                        className={cls(errors.fullName)}
                        value={form.fullName}
                        onChange={(event) => setF("fullName", event.target.value)}
                        onBlur={(event) =>
                          setErrors((current) => ({
                            ...current,
                            fullName: validateField("fullName", event.target.value) ?? undefined,
                          }))
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
                        onChange={(event) => setF("company", event.target.value)}
                        onBlur={(event) =>
                          setErrors((current) => ({
                            ...current,
                            company: validateField("company", event.target.value) ?? undefined,
                          }))
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
                          onChange={(event) => setF("email", event.target.value)}
                          onBlur={(event) =>
                            setErrors((current) => ({
                              ...current,
                              email: validateField("email", event.target.value) ?? undefined,
                            }))
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
                            onChange={(event) => setF("dialCode", event.target.value)}
                          >
                            {COUNTRIES.map((country) => (
                              <option key={country.code} value={country.dial}>
                                {country.code} {country.dial}
                              </option>
                            ))}
                          </select>
                          <input
                            id="v2-phone"
                            inputMode="tel"
                            className={cls(errors.phone)}
                            value={form.phone}
                            onChange={(event) => setF("phone", formatPhone(event.target.value))}
                            onBlur={(event) =>
                              setErrors((current) => ({
                                ...current,
                                phone: validateField("phone", event.target.value, form) ?? undefined,
                              }))
                            }
                            placeholder="770 123 4567"
                            autoComplete="tel"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
                    <label htmlFor="company_role">Company role</label>
                    <input
                      id="company_role"
                      name="company_role"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honey}
                      onChange={(event) => setHoney(event.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn-primary mt-7 w-full disabled:opacity-70"
                  >
                    {status === "sending" ? "Sending…" : leadForm.submitLabel}
                  </button>

                  <p className="mt-3 text-center text-xs text-ink-400">
                    We use your details only to prepare and respond to this quotation request.
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
