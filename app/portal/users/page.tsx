import UsersView from "./UsersView";

export const metadata = {
  title: "Users & Settings",
  description: "Who has access, what they are carrying, and what this workspace sends.",
};

export default function Page() {
  return <UsersView />;
}
