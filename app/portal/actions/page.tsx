import LockedOverlay from "@/components/portal/LockedOverlay";
import ActionsView from "./ActionsView";

export const metadata = {
  title: "Follow-up Audit Center",
  description: "The gaps you asked Vemi to check again, and what the next audit found.",
};

export default function Page() {
  return (
    <LockedOverlay title="Follow-up Audits">
      <ActionsView />
    </LockedOverlay>
  );
}
