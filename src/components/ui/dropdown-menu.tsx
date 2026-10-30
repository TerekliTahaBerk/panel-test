"use client";

import { Check } from "lucide-react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={8}
        className={cn(
          "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-48 overflow-y-auto rounded-lg border border-line bg-canvas p-1.5 text-nav shadow-popover data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

const itemClass =
  "relative flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 outline-none select-none data-[disabled]:cursor-default data-[disabled]:opacity-50 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-secondary";

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item>) {
  return <DropdownPrimitive.Item className={cn(itemClass, className)} {...props} />;
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownPrimitive.RadioItem>) {
  return (
    <DropdownPrimitive.RadioItem className={cn(itemClass, "pr-8", className)} {...props}>
      {children}
      <DropdownPrimitive.ItemIndicator className="absolute right-2 flex">
        <Check aria-hidden="true" />
      </DropdownPrimitive.ItemIndicator>
    </DropdownPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        "px-2 pt-1.5 pb-1 text-micro font-medium tracking-[0.04em] text-fg-secondary",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("-mx-1.5 my-1.5 h-px bg-line-row", className)}
      {...props}
    />
  );
}
