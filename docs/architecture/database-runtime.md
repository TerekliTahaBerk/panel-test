# Veritabanı çalışma zamanı

Sürümler ve gerekçe [ADR-0009](../decisions/ADR-0009.md) içinde kayıtlıdır.
`prisma/schema.prisma` yalnız yedi çekirdek modeli içerir; SQL migration zinciri kanonik
kaynaktır. Junction tablolar id taşımaz. Audit actor üyeliği ayrıca `(org,membership,user)`
FK'sıyla kullanıcı eşleşmesini korur. Owner FK'sı `(id,ownerMembershipId)` biçimindedir.

| Bağlantı                  | Rol                        | Kullanım                                                            |
| ------------------------- | -------------------------- | ------------------------------------------------------------------- |
| DATABASE_URL              | panel_runtime              | PrismaPg, tek lazy singleton, en çok 5 bağlantı                     |
| DIRECT_URL                | panel_migrator             | Yalnız Prisma CLI/migration, doğrudan bağlantı                      |
| TEST_DATABASE_URL         | panel_bootstrap / postgres | Yalnız izole test bootstrap ve fixture                              |
| PROVISIONING_DATABASE_URL | panel_provisioner          | Faz 03/05 için ayrılmış server-only bağlantı; üretim çağrısı kapalı |

Eksik/yanlış runtime URL ilk kullanımda CONFIGURATION hatasıdır; pg varsayılanlarına düşülmez.
Build ve client üretimi DB gerektirmez. Migration için DIRECT_URL zorunludur; boşsa CLI hata verir.
URL ve SQL loglanmaz. Server-only modüller browser bundle'ına alınamaz; lint feature/root
client ve kontrolsüz transaction import'larını sınırlar. Generated Prisma çıktısı commit edilmez;
`npm ci` postinstall ve `npm run db:generate` üretir.

`src/server/db/transaction.ts`: SERIALIZABLE, havuz bekleme 3 saniye, transaction 5 saniye,
pg bağlantı kurma 3 saniye, idle 10 saniye. Her tenant işlemi aynı transaction içinde
actor/tenant GUC'larını local kurar; kurum ve üyelik sırasıyla FOR SHARE kilitlenir.
Aktiflik, principal authVersion/expiry ve membership version tekrar kontrol edilir.
İptal/grant değişikliğiyle yarışan işler serialization hatası alabilir; güvenlik hatasından
sonra callback sürdürülmez, Prisma rollback yapar. Dış ağ çağrısı transaction'a konulmaz.

Salt okunur repository çağrıları otomatik tekrar edilmez; CONFLICT üst katmana döner.
Sentetik provisioning harness'i tam SERIALIZABLE işlemi aynı key ile en çok üç kez, jitter
ile tekrarlar (40001/40P01). Faz 03/05 gerçek provisioning adapter'ı bu kuralı korumalıdır;
callback'in yan etkileri keyfi tekrar edilmez. Commit belirsizliği aynı key ile replay edilir.

`errors.ts` unique/serialization/deadlock → CONFLICT; FK/CHECK/RLS → UNAVAILABLE;
input → INVALID_INPUT; bağlantı/diğer → DEPENDENCY olarak redakte eder. Ham PostgreSQL
hatası istemciye dönmez. Faz 02 HTTP workspace sınırı DB'ye ulaşmadan 401/no-store döner.
Gerçek auth geldikten sonra servis giriş noktaları DEPENDENCY için 503 ve requestId + güvenli
hata kodu telemetrisini bağlamalıdır; bu fazda sahte başarı veya tenant payload loglaması yoktur.
