import Nav from "@/components/v2/Nav";
import Footer from "@/components/v2/Footer";
import AccessRequestModal from "@/components/demo/AccessRequestModal";

/* Canonical marketing chrome. The former /v2 experience now lives at /. */
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
