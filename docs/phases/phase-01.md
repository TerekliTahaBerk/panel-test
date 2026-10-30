# Faz 01 — Mimari ve alan modelleme

## Amaç ve kapsam

Çok kiracılı eğitim SaaS'ı için kaynak kanıtlı alan, veri, yetki ve mahremiyet sözleşmeleri ile Faz 02/03 uygulama devri. Uygulama kaynakları, tasarım sistemi, onaylı 00–11 yol haritası ve Faz 00 tarihsel kayıtları korunur. Backend/Prisma/auth/API/migration/deployment uygulanmamıştır.

## Önkoşul kanıtı

- [Faz 00 PR #1](https://github.com/TerekliTahaBerk/panel-test/pull/1) merged; merge commit ba728d015f886201fde32c52e4be17f9ab3164f6.
- PR #1 head Quality başarılıydı; merge sonrası run 41102493037 başarısız olmuştu. [PR #2](https://github.com/TerekliTahaBerk/panel-test/pull/2) test düzeltmesi main'e birleştirilmiş.
- En güncel main: `1ed40c525afd34ab739c9c7140f4912d9819aa21`; [Quality 41104895663](https://github.com/TerekliTahaBerk/panel-test/actions/runs/41104895663) completed/success. Önkoşul bu güncel başarılı sürümle sağlandı.
- Çalışma dalı `feat/phase-01-architecture` güncel origin/main üzerinden açıldı. Başlangıç hedef çalışma ağacı temizdi.
- CLAUDE.md, docs/phases/README.md, overview, ADR-0001, reference-map okundu. Legacy yalnız okundu; üretim hizmeti/veritabanı kullanılmadı.

## Teslimatlar ve kabul kontrolü

- [x] Legacy model, servis/API, test ve migration belge envanteri: [envanter](../migration/legacy-inventory.md).
- [x] REUSE/REFACTOR/REWRITE/EXCLUDE/DEFER kararları: [reuse matrisi](../migration/reuse-matrix.md).
- [x] Sahibi ve bağımlılığı belirli alanlar: [alan sınırları](../architecture/domain-boundaries.md).
- [x] Tenant stratejisi, DB FK/RLS ve tüm veri yolları: [tenant mimarisi](../architecture/multi-tenancy.md).
- [x] Global kimlik, çoklu kurum/rol, bağımsız akademik kayıt ve opsiyonel şube: [alan modeli](../architecture/domain-model.md).
- [x] Eylem ve kaynak kapsamlı [izin matrisi](../architecture/permission-matrix.md); platform/kurum ayrımı.
- [x] Tüm önerilen modeller için alan/FK/unique/index/lifecycle/faz sözleşmesi: [DB tasarımı](../architecture/database-design.md).
- [x] Veli mahremiyeti, export/erasure/retention ve hesap silme ayrımı: [yaşam döngüsü](../architecture/data-lifecycle.md).
- [x] Altı küçük Mermaid mimari/ERD/istek akışı: [diyagramlar](../architecture/diagrams.md).
- [x] Üretim verisine erişmeyen iki senaryolu [taşıma stratejisi](../migration/migration-strategy.md).
- [x] ADR-0002–0008 ve çapraz belge tutarlılık incelemesi.
- [x] [Faz 02](phase-02-handoff.md) ve [Faz 03](phase-03-handoff.md) sıralı görev/test/kabul devri.
- [x] Backend uygulaması, aktif Prisma schema, gerçek DB, production migration veya legacy değişikliği yok.
- [x] Mevcut beş uygulama kontrolü başarılı; gerçek sonuçlar aşağıda.
- [ ] PR bağlantısı aşağıda tamamlanacak; otomatik merge yapılmayacak.

## Tutarlılık incelemesi

Sahiplik tek ownerMembershipId'dir; permission matrisi ve ERD aynı yaklaşımı kullanır. Membership çoklu RoleAssignment taşır; shell role yalnız sunumdur. GuardianRecord hesapsız veli gereksinimini karşılar. Tüm tenant tablolar organizationId ve bileşik FK taşır; global tablo istisnaları DB belgesinde tek listede tutulur. Ders/seri, materyal/ödev ve sınav/bölüm/result aynı kurumun yanında aynı parent'a ait olmayı da bileşik FK ile doğrular. Sadece tenant bütünlüğü enrollment/kapasite veya yetkiyi sağlamaz; işlem ve policy kuralları ayrıca yazılmıştır.

Faz 02 yalnız kurum altyapısı; Faz 03 kimlik ve guard; akademik schema/API Faz 06, veli ilişkisi Faz 07, sınav Faz 08, billing Faz 09. Bu ayrım onaylı yol haritasını değiştirmez. RLS gerçek runtime rolüyle test edilecek; Faz 01 bu güvenlik testlerinin çalıştırıldığı iddiasında bulunmaz.

## Açık kararlar, sahipleri ve kapanış tarihleri

| Konu                                                      | Sahip                                          | Risk / seçenekler                                                            | Son tarih                                                |
| --------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| DB sağlayıcı, veri bölgesi, sürüm/adapter/pool bütçesi    | Tenant altyapı mühendisi + ürün sahibi         | Yönetilen PostgreSQL veya işletilen PostgreSQL; maliyet/yerleşim/restore     | Faz 02 ilk migration öncesi                              |
| Kimlik sağlayıcı ve MFA/recovery yaşam döngüsü            | Kimlik mühendisi + güvenlik sorumlusu          | Yönetilen OIDC ilk tercih, olgun kütüphane ikinci; vendor ve operasyon riski | Faz 03 ilk auth kodundan önce                            |
| Session 24 saat / idle 2 saat / step-up 15 dakika önerisi | Ürün + güvenlik sorumlusu                      | Kullanılabilirlik ve hesap ele geçirme dengesi                               | Faz 03 başlangıcı                                        |
| Akademik retention, hukuki dayanak ve veri sorumluluğu    | Ürün sahibi + KVKK danışmanı + kurum yetkilisi | Sözleşme, çocuk temsil yetkisi, aktarım, purge istisnaları                   | Sağlayıcı sözleşmesi ve gerçek veri kabulünden önce      |
| RPO/RTO ve backup/restore bütçesi                         | Platform operasyon + ürün sahibi               | 24 saat/8 saat tasarım hedefi; daha sık PITR ihtiyacı                        | Faz 02 sağlayıcı seçimi; üretimden önce Faz 11 tatbikatı |
| Şube UI kapsamı ve özel roller                            | Ürün sahibi                                    | MVP opsiyonel schema, gelişmiş şube yönetimi/özel rol sonra                  | Faz 05 kapsam planlaması                                 |
| Legacy kod sahipliği/lisansı ve gerçek veri aktarımı      | Repo sahibi + kurum veri sorumlusu             | Bağımsız kural refactor veya yeniden yazım; aktarım varsayılan kapalı        | Her kod taşımasından / olası importtan önce              |

## Doğrulama

2026-10-30 yerel doğrulaması:

| Kontrol                     | Sonuç                                                   |
| --------------------------- | ------------------------------------------------------- |
| `npm run lint`              | Başarılı, exit 0                                        |
| `npm run format:check`      | Başarılı, exit 0                                        |
| `npm run typecheck`         | Başarılı, exit 0                                        |
| `npm test`                  | Başarılı, 3 dosyada 29/29 test                          |
| `npm run build`             | Başarılı; `/`, `/_not-found`, `/preview/admin` üretildi |
| Doküman göreli bağlantıları | Kırık bağlantı yok                                      |
| Kapsam incelemesi           | Yalnız README ve docs; uygulama/lockfile/env değişmedi  |

Uygulama/UI değişikliği yok; Playwright çalıştırılmadı. Mermaid kaynakları ve model/izin tutarlılığı metin üzerinden incelendi; diagram render veya taslak Prisma validate çalıştırıldığı iddia edilmez. Tenant/authorization entegrasyon testleri bu fazda uygulanmadığı için çalıştırılmadı; Faz 02/03 kabul senaryoları olarak tanımlandı.

## PR

Başlık: `Phase 01: multi-tenant architecture and domain modeling`. Hedef main; otomatik merge yok. Bağlantı PR açılınca eklenecek.
