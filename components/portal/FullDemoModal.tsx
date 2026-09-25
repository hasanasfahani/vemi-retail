"use client";

import { useState, useSyncExternalStore } from "react";
import Modal from "./Modal";
import {
  DEFAULT_DIAL,
  readAccessSnapshot,
  submitAccessRequest,
  validateAll,
  validateField,
  type AccessRequest,
  type FieldName,
} from "@/lib/demoAccess";

/* The third lead type: someone who hit a gated page and wants to see
   the whole product. Captured with the same contact fields as
   everywhere else and sent through the same endpoint, tagged so the
   notification email says which page they were standing on. */

const noopSubscribe = () => () => {};
type Errors = Partial<Record<FieldName, string>>;

const inputCls = (err?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:ring-2 focus:ring-violet/20 ${
    err ? "border-critical" : "border-line focus:border-violet"
  }`;

export default function FullDemoModal({
  open,
  onClose,
  source,
}: {
  open: boolean;
  onClose: () => void;
  /* Which page they asked from — goes into the lead. */
  source: string;
}) {
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);

  const [form, setForm] = useState<AccessRequest>({
    fullName: "",
    email: "",
    dialCode: DEFAULT_DIAL,
    phone: "",
    company: "",
  });
  const [honey, setHoney] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  /* Seed from the access session the first time the panel opens. */
  const [seeded, setSeeded] = useState(false);
  if (open && !seeded && session) {
    setSeeded(true);
    setForm((c) => ({
      ...c,
      fullName: c.fullName || session.fullName || "",
      email: c.email || session.email || "",
      company: c.company || session.company || "",
    }));
  }

  const setF = (key: FieldName, value: string) => {
    setForm((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((c) => ({ ...c, [key]: undefined }));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = Object.fromEntries(
      Object.entries(validateAll(form)).filter(([, v]) => Boolean(v))
    ) as Errors;
    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      return;
    }

    setStatus("sending");
    await submitAccessRequest(form, {
      referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
      company_role: honey,
      requestType: "Full demo",
      question: source,
    });
    setStatus("done");
  }

  const field = (
    name: FieldName,
    label: string,
    placeholder: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label htmlFor={`fd-${name}`} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      <input
        id={`fd-${name}`}
        className={inputCls(errors[name])}
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => setF(name, e.target.value)}
        onBlur={(e) =>
          setErrors((c) => ({ ...c, [name]: validateField(name, e.target.value, form) ?? undefined }))
        }
        {...extra}
      />
      {errors[name] ? (
        <p className="mt-1 text-xs" style={{ color: "var(--color-critical)" }}>
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} labelledBy="full-demo-title" width="max-w-lg">
      <div className="p-7 sm:p-8">
        {status === "done" ? (
          <div className="py-8 text-center">
            <h2 id="full-demo-title" className="t-h3 !text-xl">
              Request received.
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              Thank you — our team will be in touch within one business day to walk
              you through the full platform.
            </p>
            <button type="button" onClick={onClose} className="btn-secondary mt-6">
              Back to the dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <span className="t-eyebrow !text-violet-ink">Full platform</span>
            <h2 id="full-demo-title" className="t-h3 mt-2 !text-2xl">
              Request a full demo
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              We&apos;ll walk you through this module and the rest of the platform
              on a live call, using your categories and markets.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {field("fullName", "Full name", "Your name", { autoComplete: "name" })}
              {field("company", "Company", "Company name", { autoComplete: "organization" })}
              <div className="sm:col-span-2">
                {field("email", "Work email", "you@company.com", { type: "email", autoComplete: "email" })}
              </div>
              <div className="sm:col-span-2">
                {field("phone", "Phone", "e.g. +964 770 123 4567", {
                  type: "tel",
                  inputMode: "tel",
                  maxLength: 24,
                  autoComplete: "tel",
                })}
              </div>
            </div>

            <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
              <label htmlFor="fd-company-role">Company role</label>
              <input
                id="fd-company-role"
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
              {status === "sending" ? "Sending…" : "Request Full Demo"}
            </button>
            <p className="mt-3 text-center text-xs text-ink-600">
              We&apos;ll only use your details to arrange this demo.
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}
