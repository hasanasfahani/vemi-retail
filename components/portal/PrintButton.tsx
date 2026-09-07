"use client";

/* window.print() needs a client boundary; the Digest page itself
   stays a Server Component so its data never has to round-trip
   through the browser. */

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary !py-2 text-sm print:hidden"
    >
      Print / save as PDF
    </button>
  );
}
