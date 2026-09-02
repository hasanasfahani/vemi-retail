"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { readAccessSnapshot } from "@/lib/demoAccess";

const noopSubscribe = () => () => {};

/* Soft gate, by design — not authentication. It keeps someone who
   guesses the URL from landing mid-workspace with no context, and
   sends them to the request form instead. Anyone determined can still
   set the flag by hand; that trade-off is accepted for this version. */
export default function PortalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useSyncExternalStore(
    noopSubscribe,
    readAccessSnapshot,
    () => null
  );

  useEffect(() => {
    // Read storage directly rather than trusting `session` here: on the
    // hydration pass the store still holds the server snapshot (null),
    // and acting on that would bounce a visitor who is signed in.
    if (readAccessSnapshot() === null) router.replace("/?access=1");
  }, [router]);

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="text-sm text-ink-400">Loading workspace…</span>
      </div>
    );
  }

  return <>{children}</>;
}
