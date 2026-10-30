"use client";

import { Menu, PanelLeft, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/navigation/breadcrumbs";
import {
  NotificationsMenu,
  type NotificationItem,
} from "@/components/navigation/notifications-menu";
import { WorkspaceMark } from "@/components/navigation/workspace-mark";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { useShell } from "./shell-context";

interface TopbarProps {
  breadcrumbs: Crumb[];
  /** Page-level controls such as the date-range selector. */
  actions?: ReactNode;
  notifications: NotificationItem[];
}

export function Topbar({ breadcrumbs, actions, notifications }: TopbarProps) {
  const { collapsed, toggleCollapsed, mobileNavOpen, setMobileNavOpen, setPaletteOpen, workspace } =
    useShell();

  return (
    <header className="flex h-topbar shrink-0 items-center gap-1 border-b border-line px-2 md:gap-2 md:px-3 lg:pr-5 lg:pl-3.5">
      {/* < lg: drawer trigger */}
      <IconButton
        label="Menüyü aç"
        size="touch"
        tone="strong"
        aria-expanded={mobileNavOpen}
        aria-controls="mobile-nav"
        onClick={() => setMobileNavOpen(true)}
        className="lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </IconButton>

      {/* ≥ lg: rail toggle */}
      <IconButton
        label={collapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"}
        tooltip
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
        onClick={toggleCollapsed}
        className="hidden lg:inline-flex"
      >
        <PanelLeft className="size-[17px]" strokeWidth={1.8} />
      </IconButton>
      <span aria-hidden="true" className="mx-1 hidden h-4 w-px bg-line lg:block" />

      {/* < md: workspace name instead of breadcrumbs (prototype 13 Mobil) */}
      <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <WorkspaceMark size={24} />
        <span className="truncate text-body font-semibold">{workspace.organization.name}</span>
      </div>
      <Breadcrumbs items={breadcrumbs} className="hidden min-w-0 flex-1 md:block" />

      {workspace.isDemo ? (
        <Tooltip content="Bu önizleme kurgusal bir kurum ve demo verisi kullanır.">
          <Badge variant="demo" tabIndex={0} className="hidden max-lg:touch-hit sm:inline-flex">
            Demo verisi
          </Badge>
        </Tooltip>
      ) : null}

      {actions}

      <IconButton
        label="Ara"
        tooltip="Ara (⌘K)"
        onClick={() => setPaletteOpen(true)}
        className="size-11 rounded-md lg:size-[30px] lg:rounded-btn-sm"
      >
        <Search className="size-[17px]" strokeWidth={1.8} />
      </IconButton>
      <NotificationsMenu items={notifications} />
    </header>
  );
}
