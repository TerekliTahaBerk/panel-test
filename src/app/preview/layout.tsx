import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { isPreviewEnabled } from "@/config/app";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Preview routes use fictional institutions and demo data. They exist in
 * development and are blocked in production unless ENABLE_PREVIEW_ROUTES=true
 * is set at runtime.
 */
export default async function PreviewLayout({ children }: { children: ReactNode }) {
  await connection();
  if (!isPreviewEnabled()) notFound();
  return children;
}
