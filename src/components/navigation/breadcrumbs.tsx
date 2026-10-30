import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Konum" className={cn("min-w-0", className)}>
      <ol className="m-0 flex min-w-0 list-none items-center gap-1.5 p-0 text-nav">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <li aria-hidden="true" className="text-fg-separator">
                  /
                </li>
              ) : null}
              <li className="min-w-0 truncate">
                {last || !item.href ? (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="whitespace-nowrap text-fg-secondary transition-colors hover:text-fg"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
