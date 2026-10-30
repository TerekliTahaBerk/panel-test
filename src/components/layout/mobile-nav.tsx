"use client";

import { Dialog } from "radix-ui";
import { Sidebar } from "@/components/navigation/sidebar";
import { useShell } from "./shell-context";

/** Drawer navigation below the lg breakpoint (prototype 13 Mobil, 300px). */
export function MobileNav() {
  const { mobileNavOpen, setMobileNavOpen } = useShell();
  return (
    <Dialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(23_23_23/0.32)] data-[state=open]:animate-fade-in lg:hidden" />
        <Dialog.Content
          id="mobile-nav"
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-40 flex w-[min(300px,calc(100vw-48px))] flex-col overflow-y-auto border-r border-line bg-sidebar shadow-drawer outline-none data-[state=open]:animate-slide-in lg:hidden"
        >
          <Dialog.Title className="sr-only">Gezinme menüsü</Dialog.Title>
          <Sidebar variant="drawer" onNavigate={() => setMobileNavOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
