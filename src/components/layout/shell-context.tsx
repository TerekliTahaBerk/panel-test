"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getRoleNavigation, matchNavItem } from "@/config/navigation";
import type { WorkspaceContext } from "@/features/workspace/types";

interface ShellState {
  workspace: WorkspaceContext;
  /** Base path the workspace's nav hrefs are resolved against. */
  basePath: string;
  /** Null when the current route has no navigation entry. */
  activeNavId: string | null;
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({
  workspace,
  basePath,
  children,
}: {
  workspace: WorkspaceContext;
  basePath: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeNavId = useMemo(
    () => resolveActiveNavId(workspace, basePath, pathname),
    [workspace, basePath, pathname],
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((current) => !current), []);

  const value = useMemo(
    () => ({
      workspace,
      basePath,
      activeNavId,
      collapsed,
      toggleCollapsed,
      mobileNavOpen,
      setMobileNavOpen,
      paletteOpen,
      setPaletteOpen,
    }),
    [workspace, basePath, activeNavId, collapsed, toggleCollapsed, mobileNavOpen, paletteOpen],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}

/** Id of the nav item for the current path, or null for unknown routes. */
export function resolveActiveNavId(
  workspace: WorkspaceContext,
  basePath: string,
  pathname: string | null,
) {
  const items = getRoleNavigation(workspace.role).sections.flatMap((s) => s.items);
  return matchNavItem(items, basePath, pathname)?.id ?? null;
}
