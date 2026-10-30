import Link from "next/link";
import { WorkspaceMark } from "@/components/navigation/workspace-mark";
import { buttonVariants } from "@/components/ui/button";
import { appConfig, isPreviewEnabled, routes } from "@/config/app";

export default function HomePage() {
  const preview = isPreviewEnabled();
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-start gap-4">
        <WorkspaceMark />
        <div>
          <h1 className="m-0 text-title font-semibold">{appConfig.name}</h1>
          <p className="mt-1 mb-0 text-body text-fg-secondary">
            Faz 00 — ön yüz temeli. Kimlik doğrulama ve kurum çalışma alanları Faz 01 ile gelecek.
          </p>
        </div>
        {preview ? (
          <Link href={routes.preview.admin} className={buttonVariants({ variant: "primary" })}>
            Yönetici panelini önizle
          </Link>
        ) : null}
      </div>
    </main>
  );
}
