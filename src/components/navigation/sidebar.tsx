"use client";

import {
  ChevronsUpDown,
  CircleHelp,
  LogOut,
  Plus,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useShell } from "@/components/layout/shell-context";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import {
  getRoleNavigation,
  type FavoriteItem,
  type IdentityTone,
  type NavItem,
} from "@/config/navigation";
import { plannedScreenMessage, useDemoAction } from "@/hooks/use-demo-action";
import { cn } from "@/lib/utils";
import { WorkspaceMark } from "./workspace-mark";

type SidebarVariant = "desktop" | "drawer";

const toneClass: Record<IdentityTone, string> = {
  blue: "bg-tint-blue text-tint-blue-fg",
  green: "bg-tint-green text-tint-green-fg",
  purple: "bg-tint-purple text-tint-purple-fg",
  amber: "bg-tint-amber text-tint-amber-fg",
};

interface SidebarProps {
  variant: SidebarVariant;
  /** Called after any navigation so the drawer can close. */
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ variant, onNavigate, className }: SidebarProps) {
  const { workspace, collapsed: shellCollapsed, setPaletteOpen } = useShell();
  const nav = getRoleNavigation(workspace.role);
  const collapsed = variant === "desktop" && shellCollapsed;
  const drawer = variant === "drawer";
  const demo = useDemoAction();

  return (
    <div
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        drawer ? "px-2.5 pt-2 pb-3" : "px-2.5 pt-2.5 pb-3",
        className,
      )}
    >
      <div className={cn("flex items-center", drawer && "gap-1")}>
        <WorkspaceSwitcher collapsed={collapsed} drawer={drawer} />
        {drawer ? (
          <IconButton label="Menüyü kapat" size="touch" onClick={onNavigate}>
            <X className="size-[18px]" />
          </IconButton>
        ) : null}
      </div>

      {!drawer ? (
        <Tooltip content="Ara (⌘K)" side="right" disabled={!collapsed}>
          <button
            type="button"
            aria-label="Ara (Command K)"
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "mt-2 mb-3 flex h-[34px] w-full items-center gap-2 rounded-md bg-hover text-fg-secondary transition-colors hover:bg-selected",
              collapsed ? "justify-center px-0" : "pr-2 pl-2.5",
            )}
          >
            <Search className="size-4" strokeWidth={1.8} />
            {!collapsed ? (
              <>
                <span className="flex-1 text-left text-nav">Ara...</span>
                <Kbd aria-hidden="true">⌘ K</Kbd>
              </>
            ) : null}
          </button>
        </Tooltip>
      ) : (
        <div className="h-2" />
      )}

      {nav.sections.map((section, index) => (
        <div key={section.id}>
          {index > 0 ? <Divider /> : null}
          {section.label && !collapsed ? <Overline>{section.label}</Overline> : null}
          <nav
            aria-label={section.label ? capitalize(section.label) : "Ana menü"}
            className="flex flex-col gap-px"
          >
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                drawer={drawer}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      ))}

      <Divider />
      {!collapsed ? (
        <div
          className={cn(
            "flex items-center justify-between pr-1.5 pb-1",
            drawer ? "pl-3" : "pl-2.5",
          )}
        >
          <span className="text-micro font-medium tracking-[0.05em] text-fg-secondary">
            {nav.favorites.label}
          </span>
          {nav.favorites.canAdd ? (
            <IconButton
              label="Favori ekle"
              size={drawer ? "touch" : "sm"}
              onClick={() => demo("Favori ekle")}
            >
              <Plus className="size-3.5" strokeWidth={1.9} />
            </IconButton>
          ) : null}
        </div>
      ) : null}
      <nav aria-label={capitalize(nav.favorites.label)} className="flex flex-col gap-px">
        {nav.favorites.items.map((fav) => (
          <FavoriteLink
            key={fav.id}
            fav={fav}
            collapsed={collapsed}
            drawer={drawer}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-5">
        <RowButton
          collapsed={collapsed}
          drawer={drawer}
          label="Yardım ve Destek"
          icon={<CircleHelp className="size-[17px] text-fg-secondary" strokeWidth={1.8} />}
          onClick={() => {
            demo("Yardım ve Destek", "Destek merkezi sonraki bir fazda bağlanacak.");
            onNavigate?.();
          }}
        />
        <Divider tight />
        <AccountMenu collapsed={collapsed} drawer={drawer} />
      </div>
    </div>
  );
}

function capitalize(label: string) {
  return label.charAt(0) + label.slice(1).toLocaleLowerCase("tr-TR");
}

function Divider({ tight }: { tight?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("mx-1.5 h-px bg-line", tight ? "my-1.5" : "my-3.5")} />
  );
}

function Overline({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 text-micro font-medium tracking-[0.05em] text-fg-secondary">
      {children}
    </div>
  );
}

const rowBase = "flex w-full items-center rounded-md text-fg transition-colors hover:bg-hover";

function rowSize(collapsed: boolean, drawer: boolean, height: "nav" | "fav" = "nav") {
  if (drawer) return "h-11 gap-3 px-3 text-body";
  if (collapsed) return cn("justify-center px-0", height === "nav" ? "h-[35px]" : "h-[34px]");
  return cn("gap-2.5 px-2.5 text-nav", height === "nav" ? "h-[35px]" : "h-[34px]");
}

function SidebarNavItem({
  item,
  collapsed,
  drawer,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  drawer: boolean;
  onNavigate?: () => void;
}) {
  const { activeNavId, basePath } = useShell();
  const demo = useDemoAction();
  const active = item.id === activeNavId;
  const Icon = item.icon;
  const className = cn(
    rowBase,
    rowSize(collapsed, drawer),
    active && "bg-selected font-medium hover:bg-selected",
  );
  const content = (
    <>
      <Icon
        className={cn("size-[17px] shrink-0", active ? "text-fg" : "text-fg-secondary")}
        strokeWidth={1.8}
      />
      {!collapsed ? <span className="min-w-0 flex-1 truncate text-left">{item.label}</span> : null}
      {!collapsed && item.count !== undefined ? (
        <span className="text-caption font-normal text-fg-secondary tabular">{item.count}</span>
      ) : null}
    </>
  );

  const element = item.implemented ? (
    <Link
      href={`${basePath}${item.href}`}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={className}
      onClick={onNavigate}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={className}
      onClick={() => {
        demo(item.label, plannedScreenMessage(item.phase));
        onNavigate?.();
      }}
    >
      {content}
    </button>
  );

  return (
    <Tooltip content={item.label} side="right" disabled={!collapsed}>
      {element}
    </Tooltip>
  );
}

function FavoriteLink({
  fav,
  collapsed,
  drawer,
  onNavigate,
}: {
  fav: FavoriteItem;
  collapsed: boolean;
  drawer: boolean;
  onNavigate?: () => void;
}) {
  const demo = useDemoAction();
  return (
    <Tooltip content={fav.label} side="right" disabled={!collapsed}>
      <button
        type="button"
        aria-label={collapsed ? fav.label : undefined}
        className={cn(rowBase, rowSize(collapsed, drawer, "fav"))}
        onClick={() => {
          demo(fav.label, "Grup sayfaları Faz 02 kapsamında uygulanacak.");
          onNavigate?.();
        }}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-[18px] shrink-0 items-center justify-center rounded-xs text-[10.5px] font-semibold",
            toneClass[fav.tone],
          )}
        >
          {fav.initial}
        </span>
        {!collapsed ? <span className="min-w-0 flex-1 truncate text-left">{fav.label}</span> : null}
        {!collapsed && fav.meta ? (
          <span className="text-caption text-fg-secondary">{fav.meta}</span>
        ) : null}
      </button>
    </Tooltip>
  );
}

function RowButton({
  collapsed,
  drawer,
  label,
  icon,
  onClick,
}: {
  collapsed: boolean;
  drawer: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip content={label} side="right" disabled={!collapsed}>
      <button
        type="button"
        aria-label={collapsed ? label : undefined}
        className={cn(rowBase, rowSize(collapsed, drawer))}
        onClick={onClick}
      >
        {icon}
        {!collapsed ? <span className="flex-1 text-left">{label}</span> : null}
      </button>
    </Tooltip>
  );
}

function WorkspaceSwitcher({ collapsed, drawer }: { collapsed: boolean; drawer: boolean }) {
  const { workspace } = useShell();
  const { organization } = workspace;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Çalışma alanını değiştir"
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-md text-left transition-colors hover:bg-hover data-[state=open]:bg-hover",
            collapsed ? "justify-center px-0" : "px-2",
          )}
        >
          <WorkspaceMark />
          {!collapsed ? (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "truncate leading-[18px] font-semibold tracking-[-0.01em]",
                    drawer ? "text-body" : "text-nav",
                  )}
                >
                  {organization.name}
                </span>
                <span className="text-caption whitespace-nowrap text-fg-secondary">
                  {organization.subtitle}
                </span>
              </span>
              {!drawer ? (
                <ChevronsUpDown className="size-[15px] text-fg-muted" strokeWidth={1.8} />
              ) : null}
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>ÇALIŞMA ALANLARI</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={organization.id}>
          <DropdownMenuRadioItem value={organization.id}>
            <WorkspaceMark size={24} />
            <span className="truncate">{organization.name}</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Kurum değiştirme · Faz 01</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu({ collapsed, drawer }: { collapsed: boolean; drawer: boolean }) {
  const { workspace } = useShell();
  const demo = useDemoAction();
  const { user } = workspace;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsü"
          className={cn(
            "flex h-[46px] w-full items-center gap-2.5 rounded-md text-left transition-colors hover:bg-hover data-[state=open]:bg-hover",
            collapsed ? "justify-center px-0" : "px-2",
          )}
        >
          <Avatar name={user.name} initials={user.initials} tone="strong" />
          {!collapsed ? (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "truncate leading-[18px] font-medium",
                    drawer ? "text-body" : "text-nav",
                  )}
                >
                  {user.name}
                </span>
                <span className="text-caption text-fg-secondary">{user.roleLabel}</span>
              </span>
              {!drawer ? (
                <ChevronsUpDown className="size-[15px] text-fg-muted" strokeWidth={1.8} />
              ) : null}
            </>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side={drawer ? "top" : "right"} className="w-56">
        <DropdownMenuLabel>{user.name.toLocaleUpperCase("tr-TR")}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => demo("Profil", plannedScreenMessage("01"))}>
          <UserRound />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => demo("Hesap ayarları", plannedScreenMessage("01"))}>
          <Settings />
          Hesap ayarları
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <LogOut />
          Çıkış yap · Faz 01
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
