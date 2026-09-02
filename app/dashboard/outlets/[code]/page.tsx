import { notFound } from "next/navigation";
import OutletHistoryView from "@/components/portal/views/OutletHistoryView";
import { pos } from "@/lib/portalData";

export function generateStaticParams() {
  return pos.map((outlet) => ({ code: outlet.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return { title: `${decodeURIComponent(code)} · Photo history` };
}

export default async function OutletHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const outlet = pos.find(
    (p) => p.code.toLowerCase() === decodeURIComponent(code).toLowerCase()
  );
  if (!outlet) notFound();

  return <OutletHistoryView posId={outlet.id} />;
}
