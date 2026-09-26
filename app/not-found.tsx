import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/vemi/Logo";

export const metadata: Metadata = {
  title: "Page not found · Vemi",
};

/* One calm screen: say what happened, offer the one way back. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-16">
      <div className="flex max-w-[480px] flex-col items-center text-center">
        <Mark size={40} title="Vemi" />
        <p className="vm-label mt-8">404 · Page not found</p>
        <h1 className="mt-3 text-[32px] font-semibold leading-10 tracking-[-0.01em] text-text">
          This page moved or never existed.
        </h1>
        <p className="mt-3 text-lg text-text-muted">
          Check the address, or start again from the home page.
        </p>
        <Link href="/" className="btn-secondary mt-8">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
