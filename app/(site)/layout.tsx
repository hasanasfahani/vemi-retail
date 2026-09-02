import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import AccessRequestModal from "@/components/demo/AccessRequestModal";

/* Marketing chrome — everything outside the portal. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      <AccessRequestModal />
    </>
  );
}
