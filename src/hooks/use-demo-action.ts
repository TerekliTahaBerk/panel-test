"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";

/**
 * Explicit demo state for actions that need a backend. It tells the viewer
 * nothing was saved instead of faking success.
 */
export function useDemoAction() {
  const { notify } = useToast();
  return useCallback(
    (
      action: string,
      detail = "Bu işlem sunucu bağlantısı gerektirir; önizlemede hiçbir değişiklik kaydedilmez.",
    ) => {
      notify({ title: `Önizleme · ${action}`, description: detail });
    },
    [notify],
  );
}

/** Message for navigation targets whose screen lands in a later phase. */
export function plannedScreenMessage(phase?: string) {
  return phase
    ? `Bu ekran Faz ${phase} kapsamında uygulanacak.`
    : "Bu ekran sonraki bir fazda uygulanacak.";
}
