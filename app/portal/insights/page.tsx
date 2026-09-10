import InsightsView from "./InsightsView";

export const metadata = {
  title: "Insights",
  description: "Every measurable gap the audit found, ranked by what it costs and how sure we are.",
};

export default function Page() {
  return <InsightsView />;
}
