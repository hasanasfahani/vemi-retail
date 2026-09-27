"use client";

/* The rail, below the desktop breakpoint.

   Under 1024px the sidebar is hidden, and before this there was no
   other way to move between pages on a phone. The brand's layout rule:
   navigation collapses into a 44px menu button. It opens the same five
   groups in a drawer, keeps the active filters on every link (like
   the rail), and closes itself on navigation. */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV } from "@/lib/market/nav";
import Icon from "@/components/vemi/Icon";
import { IconButton } from "@/components/vemi/Button";
import { Drawer } from "@/components/vemi/Drawer";
import { Logo } from "@/components/vemi/Logo";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const withFilters = (href: string) => (qs ? `${href}?${qs}` : href);

  return (
    <span className="lg:hidden">
      <IconButton label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="-ml-3">
        <Icon name="menu" />
      </IconButton>
      <Drawer open={open} onClose={() => setOpen(false)} title={<Logo height={22} title="Vemi" />} width={320}>
        <nav aria-label="Sections" className="-mx-3 -mt-2">
          {NAV.map((group, i) => (
            <div key={group.label} className={i > 0 ? "mt-5" : undefined}>
              <div className="vm-label px-3 pb-1">{group.label}</div>
              {group.items.map((item) => {
                const active = pathname === item.href;
                if (item.locked) {
                  return (
                    <div key={item.href} aria-disabled="true" className="flex min-h-11 items-center gap-3 px-3 text-[15px] font-medium text-text-muted">
                      <Icon name={item.icon} className="h-5 w-5 text-line-strong" />
                      {item.label}
                      <span className="ml-auto font-mono text-xs uppercase tracking-[0.1em]">Soon</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={withFilters(item.href)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] ${
                      active ? "bg-primary-tint font-semibold text-primary-text" : "font-medium text-text hover:bg-bg"
                    }`}
                  >
                    <Icon name={item.icon} className={`h-5 w-5 ${active ? "text-primary" : "text-text-muted"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </Drawer>
    </span>
  );
}
