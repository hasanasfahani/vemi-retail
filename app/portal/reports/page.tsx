import LockedOverlay from "@/components/portal/LockedOverlay";
import ReportsView from "./ReportsView";

export const metadata = {
  title: "Monthly Reports",
  description: "The month's retail execution, assembled the way a board reads it.",
};

export default function Page() {
  return (
    <LockedOverlay title="Monthly Reports">
      <ReportsView />
    </LockedOverlay>
  );
}
