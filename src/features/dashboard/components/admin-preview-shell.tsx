"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import type { PaletteAction } from "@/components/navigation/command-palette";
import type { WorkspaceContext } from "@/features/workspace/types";
import type { QuickAction } from "../types";
import { quickActionIcons } from "./quick-actions";

/** Wires the admin workspace shell with dashboard quick actions in ⌘K. */
export function AdminPreviewShell({
  workspace,
  basePath,
  quickActions,
  children,
}: {
  workspace: WorkspaceContext;
  basePath: string;
  quickActions: QuickAction[];
  children: ReactNode;
}) {
  const paletteActions: PaletteAction[] = quickActions.map((a) => {
    const Icon = quickActionIcons[a.id];
    return { id: a.id, label: a.label, icon: <Icon strokeWidth={1.8} /> };
  });
  return (
    <AppShell workspace={workspace} basePath={basePath} paletteActions={paletteActions}>
      {children}
    </AppShell>
  );
}
