# Opaque tenant bağlamı

`src/server/tenant/principal.ts` Faz 03 VerifiedPrincipal sözleşmesini tanımlar. Gerçek
adapter henüz yoktur: requirePrincipal ve principalEvidence her zaman UNAUTHENTICATED
üretir. Testler bu modülün yalnız evidence çözümlemesini Vitest üzerinden değiştirir;
sentetik factory `tests/integration/helpers/principals.ts` dışında bulunmaz. Factory,
NODE_ENV=test gerektirir; production ortamında preview flag'i açık olsa da çalışmaz.

`resolver.ts` principal → aktif User/authVersion → kendi aktif membership'ine bağlı
Organization → roller/aktif şube grant'ları sırasıyla çözer. Slug aday seçimidir. Bootstrap
RLS politikaları yalnız tenant GUC boşken kendi üyelik/kurum kayıtlarını gösterir; tenant
GUC kurulduğunda bu ek görünürlük kapanır. Liste yalnız aktif kurum/üyelikleri döndürür;
yeni slug her seferinde yeniden çözülür, ilk kurum fallback'i yoktur.

Context yalnız resolver'ın issueContext çağrısıyla WeakMap'e kaydedilir. Taşıdığı durum:
organizationId, actorUserId, membershipId, roller, branchScope, assurance, policyVersion,
requestId ve principal kanıtı. Dış kabuk ve iç veriler dondurulur. JSON kopyası, TypeScript
cast'i veya istemciden geri gelen nesne WeakMap kaydı olmadığından reddedilir. Context'i
istekler arasında saklamayın; her işlem DB aktifliği ve version'ı yeniden doğrular.

`authorization-boundary.ts` BRANCHES üyeliğinde null veya atanmamış şubeyi reddeder.
Repository üyelik/roller için yalnız actor'ın üyeliğini döndürür; branch listesi aktif ve
izinli şubelerle sınırlıdır. Akademik kaynak politikaları bu fazda uygulanmaz.

`modules/organizations/service.ts` mevcut WorkspaceContext sunum DTO'suna dönüşür:
owner/ADMIN → admin, sonra teacher/student/parent. Owner rol satırı üretilmez. DTO yalnız
allowlist alanları taşır; rol seçimi DB yetkisi vermez. Preview/AppShell/tasarım korunur.
`/app/[orgSlug]` minimum server route'u sahte başlıklara bakmadan 401/no-store döndürür.
Faz 03 gerçek session adapter'ını ve güvenli hata HTTP eşlemesini bu sınıra bağlar.
