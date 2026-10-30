"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { useDemoAction } from "@/hooks/use-demo-action";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  meta: string;
  unread: boolean;
}

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const demo = useDemoAction();
  const unread = items.filter((n) => n.unread).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          label={unread ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"}
          className="size-11 rounded-md lg:size-[30px] lg:rounded-btn-sm"
        >
          <Bell className="size-[17px]" strokeWidth={1.8} />
          {unread ? (
            <span
              aria-hidden="true"
              className="absolute top-[11px] right-3 size-[7px] rounded-full border-[1.5px] border-canvas bg-danger-dot lg:top-1.5 lg:right-[7px]"
            />
          ) : null}
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
          <span className="text-label font-semibold">Bildirimler</span>
          {unread ? (
            <span className="text-caption text-fg-secondary tabular">{unread} yeni</span>
          ) : null}
        </div>
        <div className="px-1.5 pb-1.5">
          {items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="h-auto items-start py-2"
              onSelect={() =>
                demo("Bildirim", "Bildirim ayrıntıları sonraki bir fazda bağlanacak.")
              }
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  n.unread ? "bg-info-dot" : "bg-transparent",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-label", n.unread && "font-medium")}>{n.title}</span>
                <span className="block text-caption text-fg-secondary">{n.meta}</span>
              </span>
              {n.unread ? <span className="sr-only">(okunmamış)</span> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="mx-0" />
          <DropdownMenuItem
            className="justify-center text-fg-secondary"
            onSelect={() => demo("Tümünü okundu işaretle")}
          >
            Tümünü okundu işaretle
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
