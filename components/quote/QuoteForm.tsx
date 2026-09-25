"use client";

import { useState } from "react";
import { finalCta, leadForm, quoteScope } from "@/lib/v2Content";
import {
  DEFAULT_DIAL,
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

type QuoteField = FieldName | "industry" | "customIndustry";
type AllErrors = Partial<Record<QuoteField, string>>;

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-violet/20";

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
      <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-600">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}


/* The quote request, shared by the marketing pricing section and the
   portal's "Request a Quote" modal.

   It deliberately owns both halves — the scope sliders and the contact
   fields — so the two surfaces cannot drift apart. The caller supplies
   the frame around it and, in the portal, the contact details already
   captured when the visitor opened the dashboard. */
export default function QuoteForm({
  initialContact,
  idPrefix = "quote",
  onSubmitted,
}: {
  /* Prefilled from the portal access session; the visitor can still edit. */
  initialContact?: Partial<AccessRequest>;
  idPrefix?: string;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState<AccessRequest>({
    fullName: initialContact?.fullName ?? "",
    email: initialContact?.email ?? "",
    dialCode: initialContact?.dialCode ?? DEFAULT_DIAL,
    phone: initialContact?.phone ?? "",
    company: initialContact?.company ?? "",
  });
  const [scope, setScope] = useState<QuoteScope>({
    posPerMonth: quoteScope.posPerMonth.initial,
    categories: quoteScope.categories.initial,
    cities: quoteScope.cities.initial,
  });
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<AllErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const id = (name: string) => `${idPrefix}-${name}`;

  const setF = (key: FieldName, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = Object.fromEntries(
      Object.entries(validateAll(form)).filter(([, value]) => Boolean(value))
    ) as AllErrors;

    if (!industry) clean.industry = "Please choose your industry.";
    if (industry === "Other" && !customIndustry.trim()) {
      clean.customIndustry = "Please enter your industry.";
    }

    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      return;
    }

    setStatus("sending");
    await submitAccessRequest(form, {
      referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
      company_role: honey,
      requestType: "Pricing quotation",
      industry: industry === "Other" ? customIndustry.trim() : industry,
      posPerMonth: scope.posPerMonth,
      categories: scope.categories,
      cities: scope.cities,
    });
    setStatus("done");
    onSubmitted?.();
  }

  return (
    <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
      <div className="border-b border-line bg-canvas p-8 sm:p-10 lg:border-b-0 lg:border-r">
        <span className="t-eyebrow !text-violet-ink">{finalCta.eyebrow}</span>
        <h2 className="t-h2 mt-3 !text-[clamp(30px,3.6vw,44px)]">{finalCta.headline}</h2>
        <p className="t-lead mt-4">{finalCta.subhead}</p>

        <div className="mt-8 space-y-4">
          <ScopeRange
            id={id("pos")}
            label={quoteScope.posPerMonth.label}
            value={scope.posPerMonth}
            min={quoteScope.posPerMonth.min}
            max={quoteScope.posPerMonth.max}
            step={quoteScope.posPerMonth.step}
            minLabel={quoteScope.posPerMonth.minLabel}
            maxLabel={quoteScope.posPerMonth.maxLabel}
            valueLabel={scope.posPerMonth.toLocaleString("en-US")}
            onChange={(value) => setScope((current) => ({ ...current, posPerMonth: value }))}
          />
          <ScopeRange
            id={id("categories")}
            label={quoteScope.categories.label}
            value={scope.categories}
            min={quoteScope.categories.min}
            max={quoteScope.categories.max}
            step={quoteScope.categories.step}
            minLabel={quoteScope.categories.minLabel}
            maxLabel={quoteScope.categories.maxLabel}
            valueLabel={`${scope.categories} / ${quoteScope.categories.max}`}
            onChange={(value) => setScope((current) => ({ ...current, categories: value }))}
          />
          <ScopeRange
            id={id("cities")}
            label={quoteScope.cities.label}
            value={scope.cities}
            min={quoteScope.cities.min}
            max={quoteScope.cities.max}
            step={quoteScope.cities.step}
            minLabel={quoteScope.cities.minLabel}
            maxLabel={quoteScope.cities.maxLabel}
            valueLabel={`${scope.cities} / ${quoteScope.cities.max}`}
            onChange={(value) => setScope((current) => ({ ...current, cities: value }))}
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
            <span className="t-eyebrow !text-violet-ink">{leadForm.eyebrow}</span>
            <h3 className="t-h3 mt-2 !text-2xl">{leadForm.headline}</h3>
            <p className="mt-2 text-sm text-ink-500">{leadForm.intro}</p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor={id("name")} error={errors.fullName}>
                <input
                  id={id("name")}
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

              <Field label="Company" htmlFor={id("company")} error={errors.company}>
                <input
                  id={id("company")}
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
                <Field label="Work email" htmlFor={id("email")} error={errors.email}>
                  <input
                    id={id("email")}
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
                <Field label="Phone" htmlFor={id("phone")} error={errors.phone}>
                  <input
                    id={id("phone")}
                    type="tel"
                    inputMode="tel"
                    className={cls(errors.phone)}
                    value={form.phone}
                    maxLength={24}
                    onChange={(event) => setF("phone", event.target.value)}
                    onBlur={(event) =>
                      setErrors((current) => ({
                        ...current,
                        phone: validateField("phone", event.target.value, form) ?? undefined,
                      }))
                    }
                    placeholder="e.g. +964 770 123 4567"
                    autoComplete="tel"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Industry" htmlFor={id("industry")} error={errors.industry}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-violet-050 text-violet-ink">
                      <Icon name="assortment" className="h-4 w-4" />
                    </span>
                    <select
                      id={id("industry")}
                      className={`w-full appearance-none rounded-xl border bg-white py-3 pl-12 pr-11 text-sm font-medium outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/20 ${
                        errors.industry
                          ? "border-critical text-ink-900"
                          : `border-line ${industry ? "text-ink-900" : "text-ink-500"}`
                      }`}
                      value={industry}
                      onChange={(event) => {
                        const value = event.target.value;
                        setIndustry(value);
                        if (value !== "Other") {
                          setCustomIndustry("");
                          setErrors((current) => ({ ...current, customIndustry: undefined }));
                        }
                        if (errors.industry) {
                          setErrors((current) => ({ ...current, industry: undefined }));
                        }
                      }}
                    >
                      <option value="">Select your industry</option>
                      {leadForm.industries.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-ink"
                      aria-hidden="true"
                    >
                      <path d="m6 8 4 4 4-4" />
                    </svg>
                  </div>
                </Field>

                {industry === "Other" ? (
                  <div className="mt-3">
                    <Field
                      label="Specify your industry"
                      htmlFor={id("custom-industry")}
                      error={errors.customIndustry}
                    >
                      <input
                        id={id("custom-industry")}
                        className={cls(errors.customIndustry)}
                        value={customIndustry}
                        maxLength={100}
                        onChange={(event) => {
                          setCustomIndustry(event.target.value);
                          if (errors.customIndustry) {
                            setErrors((current) => ({ ...current, customIndustry: undefined }));
                          }
                        }}
                        placeholder="Enter your industry"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </div>

            <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
              <label htmlFor={id("company-role")}>Company role</label>
              <input
                id={id("company-role")}
                name="company_role"
                tabIndex={-1}
                autoComplete="off"
                value={honey}
                onChange={(event) => setHoney(event.target.value)}
              />
            </div>

            <div className="mt-7 rounded-xl border border-violet/15 bg-violet-050 px-4 py-3 text-center text-xs font-medium text-violet-ink">
              Quote scope: {scope.posPerMonth.toLocaleString("en-US")} POS / month ·{" "}
              {scope.categories} {scope.categories === 1 ? "category" : "categories"} ·{" "}
              {scope.cities} {scope.cities === 1 ? "city" : "cities"}
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary mt-3 w-full disabled:opacity-70"
            >
              {status === "sending" ? "Sending…" : leadForm.submitLabel}
            </button>

            <p className="mt-3 text-center text-xs text-ink-600">
              We use your details only to prepare and respond to this quotation request.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
