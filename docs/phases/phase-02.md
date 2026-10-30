# Faz 02 — Çok kiracılı altyapı

Durum: **Devam ediyor**; yerel güvenlik kanıtları mevcut, PR/uzak CI kanıtı bekleniyor.
Faz 00 PR #1/#2 ve Faz 01 PR #3 main'e birleştirilmiştir. Başlangıç origin/main
`40e6127`; çalışma ağacı temizdi. Dal: `feat/phase-02-multi-tenant`.
Faz 03 başlamadı. Online Dershanem deposu/veritabanı/servislerine erişilmedi.

## Uygulanan kapsam

- PostgreSQL 17.10; Prisma CLI/Client/adapter-pg 7.10.1, pg 8.23.1, Node 22.12+.
- Yedi model: User, Organization, OrganizationMembership, RoleAssignment, Branch,
  BranchMembership, AuditLog. Auth/akademik/billing tablosu eklenmedi.
- Üç kanonik migration: `202610300001_core`, `202610300002_security`, `202610300003_provisioning`.
- Bileşik FK, doğal junction PK/reverse indeks, immutable tenant/receipt/grant, CHECK ve
  deferred owner kontrolleri. Audit runtime append-only.
- Migrator/runtime/caller/NOLOGIN function-owner ayrı; actual grant/RLS ve SET ROLE denemeleri testli.
- Opaque WeakMap TenantContext, fail-closed principal adapter, SERIALIZABLE transaction-local
  GUC, aktiflik/version kontrolü, kurum→üyelik kilidi, scoped repository ve şube filtresi.
- İdempotent, actor kilitli dar SECURITY DEFINER provisioning; tek kurum/üyelik/audit,
  rollback/replay/paralel çağrı ve kota testleri. Üretim servis kapısı ve varsayılan kota kapalı.
- `/app/[orgSlug]` kimliksiz 401/no-store; sahte header kimlik vermez. Shell projection
  sözleşmesi hazır; mevcut tasarım/preview korunur, canlı switcher yoktur.
- CI'ye ayrı PostgreSQL service container, güvenli bootstrap, migrate deploy ve actual DB test işi eklendi.

## Yerel doğrulama kanıtı

| Kontrol                             | Sonuç                                                                                                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boş DB migration + ikinci deploy    | PostgreSQL 17.10 üzerinde başarılı / no pending migrations                                                                                                                 |
| Gerçek PostgreSQL güvenlik testleri | 78/78 başarılı; [tek tek matris](../security/tenant-isolation-test-matrix.md)                                                                                              |
| Lint / typecheck                    | Başarılı                                                                                                                                                                   |
| Unit/component                      | 29/29 başarılı                                                                                                                                                             |
| Production build                    | `npm run build -- --webpack` başarılı                                                                                                                                      |
| Varsayılan Turbopack                | Ortam alt süreç port izni nedeniyle EPERM; uygulama hatası olarak gizlenmedi                                                                                               |
| Format / e2e                        | Başarılı / 13 test başarılı; dört viewport screenshot incelendi                                                                                                            |
| Prisma validate / migrate diff      | Başarılı / empty migration; gerçek SQL şeması uyumlu                                                                                                                       |
| Geliştirme DB                       | Ayrı panel_local_dev kurulumu ve ikinci deploy başarılı; kota 0                                                                                                            |
| Uzak CI                             | [Quality 41119603140](https://github.com/TerekliTahaBerk/panel-test/actions/runs/41119603140) üç iş başarılı; yerel geliştirme hazırlama ekinin yeni koşusu takip edilecek |

İlk migration denemesinde function-owner devrinden sonraki GRANT ayrıcalığı actual PostgreSQL'de
reddedildi; kalıtımı genişletmeden migration-local SET ROLE ile düzeltildi ve yeni boş DB'de
zincir yeniden uygulandı. Başarısız geliştirme DB'si otomatik resetlenmedi. Bootstrap policies
actual tenant scope kurulduğunda kapanır; principal'la B'deki kendi membership'ini A'dan okuma
adversarial testi ayrıca eklendi.

## Kabul ve kalan sınırlar

- [x] DB/Prisma modelleri, kanonik migration ve generated client çalışıyor.
- [x] Catalog ile FK/PK/CHECK/deferred trigger/FORCE RLS/role sahipliği doğrulandı.
- [x] Actual runtime/caller erişimleri ve pooled state izolasyonu test edildi.
- [x] TenantContext, resolver, repository, şube kapsamı ve iki kurum farklı rol testi geçti.
- [x] Provisioning atomic/idempotent; audit/privilege/commit/serialization hataları test edildi.
- [x] Gerçek auth yokken production identity/provisioning/workspace kapalı.
- [x] Faz dışı frontend/akademik/auth/billing veya production deployment yapılmadı.
- [ ] Son format/Playwright kontrolleri ve uzak GitHub Actions başarılı.
- [x] [PR #4](https://github.com/TerekliTahaBerk/panel-test/pull/4) incelemeye açık; otomatik merge yok.

Gerçek MFA/e-posta/session, CSRF/origin ve rate limit Faz 03/05'e aittir. Kota testi 5 kullanır;
production policy varsayılan 0'dır. Sağlayıcı, veri bölgesi, gerçek secret provisioning, backup/PITR,
restore, hukuki retention/purge hâlâ üretim önkoşullarıdır. RLS keyfi runtime SQL ele geçirilmesini
tek başına çözmez. Bu fazda üretim credential'ı veya gerçek müşteri verisi oluşturulmadı.

Faz 03 devri: VerifiedPrincipal'ın gerçek güven sınırını kur; revocation/authVersion/expiry,
email/AAL2 ve 15 dakika step-up doğrula. Context'i her istekte yeniden çöz. Gelecek mutations;
kaynak izni + branch + sürüm/kilit + redakte audit'i aynı transaction'da uygulasın. Public
onboarding Faz 05'ten önce açılmasın. Ayrıntılar [tenant-context](../architecture/tenant-context.md),
[provisioning](../architecture/provisioning-implementation.md), [ADR-0009](../decisions/ADR-0009.md).
