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
import Icon from "@/components/vemi/Icon";
import { TextField, SelectField } from "@/components/vemi/Field";

type QuoteScope = {
  posPerMonth: number;
  categories: number;
  cities: number;
};

type QuoteField = FieldName | "industry" | "customIndustry";
type AllErrors = Partial<Record<QuoteField, string>>;

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
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-text">
          {label}
        </label>
        <output
          htmlFor={id}
          className="min-w-20 rounded-sm bg-primary-tint px-3 py-1 text-center font-mono text-base font-medium tabular-nums text-primary-text"
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
        className="mt-4 h-11 w-full cursor-pointer [accent-color:var(--vm-primary)]"
      />
      <div className="flex justify-between font-mono text-xs text-text-muted">
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
  initialIndustry,
  idPrefix = "quote",
  onSubmitted,
}: {
  /* Prefilled from the portal access session; the visitor can still edit. */
  initialContact?: Partial<AccessRequest>;
  initialIndustry?: string;
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
  /* A stored industry that is not one of the listed options came from
     the "Other" box, so restore it there rather than dropping it. */
  const known = initialIndustry && leadForm.industries.includes(initialIndustry);
  const [industry, setIndustry] = useState(
    initialIndustry ? (known ? initialIndustry : "Other") : ""
  );
  const [customIndustry, setCustomIndustry] = useState(
    initialIndustry && !known ? initialIndustry : ""
  );
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

  const blur = (key: FieldName) => (event: React.FocusEvent<HTMLInputElement>) =>
    setErrors((current) => ({
      ...current,
      [key]: validateField(key, event.target.value, form) ?? undefined,
    }));

  return (
    <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
      <div className="border-b border-line bg-bg p-6 sm:p-10 lg:border-b-0 lg:border-r">
        <span className="vm-label text-primary-text">01 · {finalCta.eyebrow}</span>
        <h2 className="mt-3 text-[28px] font-semibold leading-[36px] tracking-[-0.01em] text-text sm:text-[36px] sm:leading-[44px]">
          {finalCta.headline}
        </h2>
        <p className="mt-4 text-base leading-6 text-text">{finalCta.subhead}</p>

        <div className="mt-8 space-y-3">
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

        <p className="mt-6 flex items-start gap-2 text-sm leading-5 text-text-muted">
          <Icon name="check" size={16} className="mt-0.5 shrink-0 text-primary-text" />
          {leadForm.subhead}
        </p>
      </div>

      <div className="p-6 sm:p-10">
        {status === "done" ? (
          <div className="flex h-full min-h-[420px] flex-col items-start justify-center" role="status">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-tint text-primary-text">
              <Icon name="check" size={24} />
            </span>
            <h3 className="mt-5 text-[22px] font-semibold leading-7 text-text">{leadForm.success.title}</h3>
            <p className="mt-2 max-w-sm text-base leading-6 text-text">{leadForm.success.body}</p>
            <p className="mt-6 font-mono text-xs text-text-muted">
              {scope.posPerMonth.toLocaleString("en-US")} POS / month · {scope.categories}{" "}
              {scope.categories === 1 ? "category" : "categories"} · {scope.cities}{" "}
              {scope.cities === 1 ? "city" : "cities"}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <span className="vm-label text-primary-text">02 · {leadForm.eyebrow}</span>
            <h3 className="mt-3 text-[22px] font-semibold leading-7 text-text sm:text-[28px] sm:leading-9">
              {leadForm.headline}
            </h3>
            <p className="mt-2 text-base leading-6 text-text">{leadForm.intro}</p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                id={id("name")}
                error={errors.fullName}
                value={form.fullName}
                onChange={(event) => setF("fullName", event.target.value)}
                onBlur={blur("fullName")}
                placeholder="Your name"
                autoComplete="name"
              />
              <TextField
                label="Company"
                id={id("company")}
                error={errors.company}
                value={form.company}
                onChange={(event) => setF("company", event.target.value)}
                onBlur={blur("company")}
                placeholder="Company name"
                autoComplete="organization"
              />
              <TextField
                className="sm:col-span-2"
                label="Work email"
                id={id("email")}
                type="email"
                error={errors.email}
                value={form.email}
                onChange={(event) => setF("email", event.target.value)}
                onBlur={blur("email")}
                placeholder="you@company.com"
                autoComplete="email"
              />
              <TextField
                className="sm:col-span-2"
                label="Phone"
                id={id("phone")}
                type="tel"
                inputMode="tel"
                maxLength={24}
                error={errors.phone}
                value={form.phone}
                onChange={(event) => setF("phone", event.target.value)}
                onBlur={blur("phone")}
                placeholder="e.g. +964 770 123 4567"
                autoComplete="tel"
              />
              <SelectField
                className="sm:col-span-2"
                label="Industry"
                id={id("industry")}
                error={errors.industry}
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
              </SelectField>

              {industry === "Other" ? (
                <TextField
                  className="sm:col-span-2"
                  label="Specify your industry"
                  id={id("custom-industry")}
                  error={errors.customIndustry}
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
              ) : null}
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

            <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-xs text-text-muted">
              <span>Quote scope</span>
              <span className="text-text">
                {scope.posPerMonth.toLocaleString("en-US")} POS / month · {scope.categories}{" "}
                {scope.categories === 1 ? "category" : "categories"} · {scope.cities}{" "}
                {scope.cities === 1 ? "city" : "cities"}
              </span>
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="vm-btn vm-btn--primary vm-btn--block mt-4"
            >
              {status === "sending" ? "Sending…" : leadForm.submitLabel}
            </button>

            <p className="mt-3 text-sm leading-5 text-text-muted">
              We use your details only to prepare and respond to this quotation request.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
