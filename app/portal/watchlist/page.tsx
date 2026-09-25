import LockedOverlay from "@/components/portal/LockedOverlay";
import WatchlistView from "./WatchlistView";

export const metadata = {
  title: "Watchlist",
  description: "Figures you asked to keep an eye on, and what has happened since.",
};

export default function Page() {
  return (
    <LockedOverlay title="Watchlist">
      <WatchlistView />
    </LockedOverlay>
  );
}
