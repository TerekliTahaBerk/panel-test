"use client";

import { useEffect, type ReactNode } from "react";
import { CommandPalette, type PaletteAction } from "@/components/navigation/command-palette";
import { Sidebar } from "@/components/navigation/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { WorkspaceContext } from "@/features/workspace/types";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import { ShellProvider, useShell } from "./shell-context";

interface AppShellProps {
  workspace: WorkspaceContext;
  basePath: string;
  paletteActions?: PaletteAction[];
  children: ReactNode;
}

/**
 * Shared SaaS workspace layout: role-aware sidebar (expanded / rail /
 * drawer), command palette and toasts. Pages render their own Topbar so
 * they can supply page-level controls.
 */
export function AppShell({ workspace, basePath, paletteActions, children }: AppShellProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <ToastProvider>
        <ShellProvider workspace={workspace} basePath={basePath}>
          <ShellLayout paletteActions={paletteActions}>{children}</ShellLayout>
        </ShellProvider>
      </ToastProvider>
    </TooltipProvider>
  );
}

function ShellLayout({
  paletteActions,
  children,
}: {
  paletteActions?: PaletteAction[];
  children: ReactNode;
}) {
  const { collapsed, setPaletteOpen } = useShell();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setPaletteOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-label focus:text-fg-inverse"
      >
        İçeriğe geç
      </a>
      <div className="flex min-h-dvh bg-canvas">
        <div
          className={cn(
            "hidden shrink-0 border-r border-line bg-sidebar transition-[width] duration-[var(--ds-duration-enter)] ease-out lg:block",
            collapsed ? "w-rail" : "w-sidebar",
          )}
        >
          <aside
            id="app-sidebar"
            aria-label="Kenar çubuğu"
            className="sticky top-0 flex h-dvh flex-col overflow-x-hidden overflow-y-auto"
          >
            <Sidebar variant="desktop" />
          </aside>
        </div>
        <MobileNav />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      <CommandPalette actions={paletteActions} />
    </>
  );
}
