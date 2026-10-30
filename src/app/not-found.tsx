import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <EmptyState
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa yok veya bu ortamda kullanılamıyor."
        action={
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            Ana sayfaya dön
          </Link>
        }
      />
    </main>
  );
}
