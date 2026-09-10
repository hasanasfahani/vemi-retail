import ReportsIndexView from "./ReportsIndexView";

export const metadata = {
  title: "Reports you built",
  description: "Your own reports — the blocks you chose, over the scope you choose.",
};

export default function Page() {
  return <ReportsIndexView />;
}
