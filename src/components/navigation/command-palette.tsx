"use client";

import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { useShell } from "@/components/layout/shell-context";
import { getRoleNavigation } from "@/config/navigation";
import { plannedScreenMessage, useDemoAction } from "@/hooks/use-demo-action";

export interface PaletteAction {
  id: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
}

/** ⌘K command palette (prototype: max-w 560, radius 14). */
export function CommandPalette({ actions = [] }: { actions?: PaletteAction[] }) {
  const { paletteOpen, setPaletteOpen, workspace, basePath } = useShell();
  const router = useRouter();
  const demo = useDemoAction();
  const items = getRoleNavigation(workspace.role).sections.flatMap((s) => s.items);

  const close = () => setPaletteOpen(false);

  return (
    <Dialog.Root open={paletteOpen} onOpenChange={setPaletteOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgb(23_23_23/0.24)] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-32px)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl bg-canvas shadow-dialog outline-none data-[state=open]:animate-fade-in"
        >
          <Dialog.Title className="sr-only">Komut paleti</Dialog.Title>
          <Command label="Komut paleti" loop className="flex flex-col">
            <div className="flex h-[46px] items-center gap-2.5 border-b border-line-row px-3.5">
              <Search className="size-4 text-fg-secondary" strokeWidth={1.8} />
              <Command.Input
                autoFocus
                placeholder="Sayfa veya işlem ara..."
                className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-fg-muted focus-visible:outline-none"
              />
            </div>
            <Command.List className="max-h-[min(360px,60vh)] overflow-y-auto p-1.5">
              <Command.Empty className="px-2 py-6 text-center text-meta text-fg-secondary">
                Sonuç bulunamadı.
              </Command.Empty>
              <Command.Group heading="SAYFALAR" className={groupClass}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={`sayfa ${item.label}`}
                      onSelect={() => {
                        close();
                        if (item.implemented) router.push(`${basePath}${item.href}`);
                        else demo(item.label, plannedScreenMessage(item.phase));
                      }}
                      className={itemClass}
                    >
                      <Icon className="size-4 text-fg-secondary" strokeWidth={1.8} />
                      <span className="flex-1">{item.label}</span>
                      {!item.implemented ? (
                        <span className="text-caption text-fg-secondary">Faz {item.phase}</span>
                      ) : (
                        <CornerDownLeft className="size-3.5 text-fg-muted" />
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
              {actions.length ? (
                <Command.Group heading="İŞLEMLER" className={groupClass}>
                  {actions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={`işlem ${action.label}`}
                      onSelect={() => {
                        close();
                        demo(action.label);
                      }}
                      className={itemClass}
                    >
                      <span className="flex text-fg-secondary [&_svg]:size-4">{action.icon}</span>
                      <span className="flex-1">{action.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:tracking-[0.04em] [&_[cmdk-group-heading]]:text-fg-secondary";

const itemClass =
  "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2 text-nav select-none data-[selected=true]:bg-hover";
