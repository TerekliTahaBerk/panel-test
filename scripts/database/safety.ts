export function isolatedDestination(raw: string | undefined) {
  if (process.env.NODE_ENV === "production" || !raw)
    throw new Error("İzole test yapılandırması gerekli");
  const url = new URL(raw);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    (!/^\/panel_[a-z0-9_]+_test$/.test(url.pathname) && url.pathname !== "/panel_local_dev") ||
    /prod|staging|live/i.test(url.pathname) ||
    url.search ||
    url.hash ||
    !["panel_bootstrap", "postgres"].includes(url.username)
  )
    throw new Error("Güvensiz test hedefi reddedildi");
  return url;
}
export function roleUrl(url: URL, role: string) {
  const copy = new URL(url);
  copy.username = role;
  return copy.toString();
}

export function testDestination(raw: string | undefined) {
  const url = isolatedDestination(raw);
  if (!/^\/panel_[a-z0-9_]+_test$/.test(url.pathname)) throw new Error("Dedicated test DB gerekli");
  return url;
}
export function localDestination(raw: string | undefined) {
  const url = isolatedDestination(raw);
  if (url.pathname !== "/panel_local_dev") throw new Error("Yalnız panel_local_dev kabul edilir");
  return url;
}
