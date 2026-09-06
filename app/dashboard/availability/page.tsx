import { redirect } from "next/navigation";

/* Availability merged into /dashboard/shelf (Phase 8). A stored link
   to the old route still lands somewhere real, on the right tab, with
   its filters carried across. */
export default async function AvailabilityRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
  }
  params.set("mode", "availability");
  redirect(`/dashboard/shelf?${params.toString()}`);
}
