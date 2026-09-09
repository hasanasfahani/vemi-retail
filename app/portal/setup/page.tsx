import SetupView from "./SetupView";

export const metadata = {
  title: "Audit Setup",
  description: "What is monitored under this subscription, and what good looks like.",
};

export default function Page() {
  return <SetupView />;
}
