import { redirect } from "next/navigation";

/* Shelf Share merged into /dashboard/shelf (Phase 8). A stored link
   to the old route still lands somewhere real, on the right tab, with
   its filters carried across. */
export default async function ShelfShareRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
  }
  params.set("mode", "share");
  redirect(`/dashboard/shelf?${params.toString()}`);
}
