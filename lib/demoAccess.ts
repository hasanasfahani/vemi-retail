/* ============================================================
   VEMI — ACCESS REQUEST MODEL
   Validation rules, dial codes, the session flag that unlocks the
   portal, and the single submit seam.

   The submit seam (`submitAccessRequest`) currently resolves locally.
   Phase 2 replaces its body with a POST to the route handler — no
   caller changes required.
   ============================================================ */

export type AccessRequest = {
  fullName: string;
  email: string;
  dialCode: string;
  phone: string;
  company: string;
};

export type FieldName = keyof AccessRequest;

/* ---------- phone: dial codes -------------------------------
   Iraq first (the default), then the markets where target
   decision-makers actually sit. */
export type Country = { code: string; name: string; dial: string };

export const COUNTRIES: Country[] = [
  { code: "IQ", name: "Iraq", dial: "+964" },
  { code: "TR", name: "Türkiye", dial: "+90" },
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "JO", name: "Jordan", dial: "+962" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "NL", name: "Netherlands", dial: "+31" },
];

export const DEFAULT_DIAL = "+964";

/* ---------- email: consumer-domain screen -------------------
   Not a security control — a qualification nudge. Anything not on
   this list passes. */
const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "live.com",
  "protonmail.com",
  "proton.me",
  "msn.com",
  "me.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
]);

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isPersonalDomain(email: string): boolean {
  return PERSONAL_DOMAINS.has(domainOf(email));
}

/* ---------- per-field validation ---------------------------
   Returns a human message, or null when the field is fine. */
export function validateField(
  name: FieldName,
  value: string,
  all?: Partial<AccessRequest>
): string | null {
  const v = value.trim();

  switch (name) {
    case "fullName":
      if (!v) return "Please enter your full name.";
      if (v.length < 2) return "Please enter your full name.";
      return null;

    case "company":
      if (!v) return "Please enter your company name.";
      if (v.length < 2) return "Please enter your company name.";
      return null;

    case "email":
      if (!v) return "Please enter your work email.";
      if (!EMAIL_SHAPE.test(v)) return "That email doesn't look complete.";
      if (isPersonalDomain(v))
        return "Please use your work email — we set up access per company.";
      return null;

    case "phone": {
      const digits = v.replace(/\D/g, "");
      if (!digits) return "Please enter your phone number.";
      if (digits.length < 6 || digits.length > 14)
        return `That number looks short for ${all?.dialCode ?? DEFAULT_DIAL}.`;
      return null;
    }

    case "dialCode":
      return v ? null : "Select a country code.";
  }
}

export function validateAll(form: AccessRequest): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  (Object.keys(form) as FieldName[]).forEach((k) => {
    const msg = validateField(k, form[k], form);
    if (msg) errors[k] = msg;
  });
  return errors;
}

/* Digits only, grouped 3–3–rest: reads as 770 123 4567 for an Iraqi
   mobile and stays sane for longer international numbers. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(" ");
}

/* ---------- session flag ------------------------------------
   A soft UX gate, deliberately not authentication. It marks a
   visitor as provisioned so the portal reads as unlocked. */
const SESSION_KEY = "vemi.access";

export type AccessSession = {
  fullName: string;
  company: string;
  email: string;
  grantedAt: string;
};

export function grantAccess(req: AccessRequest): AccessSession {
  const session: AccessSession = {
    fullName: req.fullName.trim(),
    company: req.company.trim(),
    email: req.email.trim().toLowerCase(),
    grantedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* private mode / storage blocked — the portal still opens. */
  }
  return session;
}

export function readAccess(): AccessSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AccessSession) : null;
  } catch {
    return null;
  }
}

export function hasAccess(): boolean {
  return readAccess() !== null;
}

/* Identity-stable read for `useSyncExternalStore` — re-parses only when
   the stored string actually changes, so React doesn't loop. */
let cachedRaw: string | null = null;
let cachedSession: AccessSession | null = null;

export function readAccessSnapshot(): AccessSession | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(SESSION_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as AccessSession) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

export const PORTAL_ENTRY = "/dashboard/overview";

/* ---------- submit ------------------------------------------
   Posts the lead, and holds for a minimum beat regardless of how
   fast the network answers: provisioning should feel like it is
   doing something. A capture failure never blocks the visitor —
   the endpoint answers 200 and we open the workspace either way. */
const MIN_HOLD_MS = 1600;

export type SubmitMeta = {
  source?: string;
  referrer?: string;
  company_role?: string; // honeypot — empty for every real submission
};

export async function submitAccessRequest(
  req: AccessRequest,
  meta: SubmitMeta = {}
): Promise<void> {
  const hold = new Promise((resolve) => setTimeout(resolve, MIN_HOLD_MS));

  const post = fetch("/api/access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, ...meta }),
  }).catch((err) => {
    console.error("[vemi] access request could not be sent", err);
  });

  await Promise.all([hold, post]);
}
