export const appConfig = {
  name: "Eğitim Platformu",
  locale: "tr-TR",
  timeZone: "Europe/Istanbul",
} as const;

/**
 * Preview routes render fictional institutions and demonstration data.
 * They are always on in development and must be enabled explicitly in a
 * production build (`ENABLE_PREVIEW_ROUTES=true`). Read on the server only.
 */
export function isPreviewEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" || env.ENABLE_PREVIEW_ROUTES === "true";
}

/** Route conventions. Authenticated workspace routes arrive in Phase 01. */
export const routes = {
  home: "/",
  preview: {
    admin: "/preview/admin",
  },
} as const;
