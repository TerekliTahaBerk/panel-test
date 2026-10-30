"use client";

import { Ellipsis } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { useDemoAction } from "@/hooks/use-demo-action";
import { cn } from "@/lib/utils";
import type { AttentionItem, AttentionSeverity } from "../types";

const dot: Record<AttentionSeverity, string> = {
  critical: "bg-danger-dot",
  warning: "bg-warning-dot",
  info: "bg-neutral-dot",
};

const severityLabel: Record<AttentionSeverity, string> = {
  critical: "Kritik",
  warning: "Uyarı",
  info: "Bilgi",
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
  const demo = useDemoAction();
  return (
    <Card aria-labelledby="h-att">
      <CardHeader className="flex-nowrap pb-3">
        <div className="flex items-center gap-2">
          <CardTitle id="h-att">Dikkat Gerektirenler</CardTitle>
          <Badge variant="count">{items.length}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="Dikkat gerektirenler seçenekleri" size="md" tone="muted">
              <Ellipsis className="size-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => demo("Tümünü görüntüle")}>
              Tümünü görüntüle
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => demo("Bildirim tercihleri")}>
              Bildirim tercihleri
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 border-t border-line-row py-3 pr-4 pl-5 transition-colors hover:bg-row-hover"
          >
            <span
              aria-hidden="true"
              className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot[item.severity])}
            />
            <div className="min-w-0 flex-1">
              <div className="text-nav leading-[19px] font-medium">
                <span className="sr-only">{severityLabel[item.severity]}: </span>
                {item.title}
              </div>
              <div className="mt-0.5 text-meta text-fg-secondary">{item.detail}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => demo(item.actionLabel)}>
              {item.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
