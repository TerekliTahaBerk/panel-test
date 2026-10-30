# Tenant izolasyonu test matrisi

Kaynak: `tests/integration/security.test.ts`; fixture'lar tamamen sentetiktir.
2026-10-30: PostgreSQL 17.10, actual migration/grant/RLS ile **77/77 başarılı**.
Prisma resolver/repository testlerinde yalnız principal evidence factory'si test modülüdür;
DB, ORM işlemleri, transaction, SQL constraint ve politikalar mock değildir.

| Grup                                  | Test / beklenen davranış                                                           | Sonuç    |
| ------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Gerçek PostgreSQL: catalog ve roller  | yedi model, doğal PK, bileşik FK, CHECK, deferred trigger ve zorunlu RLS           | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime ve caller superuser/owner/BYPASSRLS değildir; function-owner NOLOGIN       | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime SET ROLE panel_migrator reddedilir                                         | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime SET ROLE panel_provisioner reddedilir                                      | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime SET ROLE panel_provision_owner reddedilir                                  | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime DDL/TRUNCATE reddi: CREATE TABLE public.forbidden(id int)                  | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime DDL/TRUNCATE reddi: CREATE TEMP TABLE forbidden(id int)                    | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime DDL/TRUNCATE reddi: ALTER TABLE public."Branch" DISABLE ROW LEVEL SECURITY | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime DDL/TRUNCATE reddi: TRUNCATE public."Branch"                               | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | runtime provisioning fonksiyonunu çağıramaz ve makbuzları okuyamaz                 | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | caller tablo erişimi reddedilir: SELECT * FROM                                     | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | caller tablo erişimi reddedilir: DELETE FROM                                       | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | PUBLIC EXECUTE yok; caller DML/rol/DDL alamaz                                      | Başarılı |
| Gerçek PostgreSQL: catalog ve roller  | migration geçmişi üç başarılı kayıt taşır; canonical SQL dosyaları mevcut          | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | A context B üyelerini/count/aggregate göremez                                      | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | A B satırlarını update/delete edemez                                               | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | bağlamsız OrganizationMembership sıfır satır                                       | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | bağlamsız RoleAssignment sıfır satır                                               | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | bağlamsız Branch sıfır satır                                                       | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | bağlamsız BranchMembership sıfır satır                                             | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | bağlamsız AuditLog sıfır satır                                                     | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | eksik/geçersiz tenant ayarı insert reddeder                                        | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | A → B → bağlamsız aynı havuzda context sızıntısı yok                               | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | rollback context'i temizler ve bağlantı tekrar kullanılabilir                      | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | cross-tenant direct ve bulk FK reddi                                               | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | Prisma nested create ve compound-key connect tenant dışına çıkamaz                 | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | grant doğal PK duplicate reddi ve değişmezliği                                     | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | organizationId ve provisioning makbuzları değiştirilemez                           | Başarılı |
| Tenant izolasyonu, ilişkiler ve havuz | audit actor üye/user eşleşmesi bileşik FK ile korunur; append-only runtime         | Başarılı |
| Üyelik, resolver ve sahiplik          | kurum değiştirirken ADMIN rolü TEACHER kurumuna taşınmaz                           | Başarılı |
| Üyelik, resolver ve sahiplik          | yalnız A kullanıcısı B slug/id veya unknown slug ile veri göremez                  | Başarılı |
| Üyelik, resolver ve sahiplik          | revoked/suspended üyelik reddedilir                                                | Başarılı |
| Üyelik, resolver ve sahiplik          | revoked/suspended üyelik reddedilir                                                | Başarılı |
| Üyelik, resolver ve sahiplik          | şube kısıtı yalnız atanan aktif şubeyi döndürür; şubesiz ve diğer şube reddi       | Başarılı |
| Üyelik, resolver ve sahiplik          | taklit/JSON context güvenlik kanıtı değildir                                       | Başarılı |
| Üyelik, resolver ve sahiplik          | stale context üyelik iptali ve grant değişimi sonrasında reddedilir                | Başarılı |
| Üyelik, resolver ve sahiplik          | suspended kurum eski context ve resolver erişimini kapatır                         | Başarılı |
| Üyelik, resolver ve sahiplik          | ACTIVE kurum sahipsiz ve foreign owner olamaz                                      | Başarılı |
| Üyelik, resolver ve sahiplik          | mevcut owner revoke veya BRANCHES yapılamaz                                        | Başarılı |
| Üyelik, resolver ve sahiplik          | eşzamanlı owner devirleri sonunda tek geçerli owner kalır                          | Başarılı |
| Ek adversarial doğrulamalar           | gerçek principal ile A transaction B'deki kendi üyeliğini dahi okuyamaz            | Başarılı |
| Ek adversarial doğrulamalar           | gerçek SERIALIZABLE yazma çakışması tam rollback olur                              | Başarılı |
| Ek adversarial doğrulamalar           | deferred owner/commit hatası kurum ve üyeliği geri alır                            | Başarılı |
| Ek adversarial doğrulamalar           | WorkspaceContext projection yalnız yetkili DTO alanlarını taşır                    | Başarılı |
| Dar provisioning primitive'i          | atomik DRAFT → owner → ACTIVE ve tek audit; OWNER rolü yok                         | Başarılı |
| Dar provisioning primitive'i          | aynı key/payload ve kaybolan commit yanıtı güvenle replay olur                     | Başarılı |
| Dar provisioning primitive'i          | aynı key farklı payload conflict                                                   | Başarılı |
| Dar provisioning primitive'i          | paralel aynı key yalnız bir kurum ve audit yaratır                                 | Başarılı |
| Dar provisioning primitive'i          | farklı actor aynı slug: tek başarı ve tek conflict                                 | Başarılı |
| Dar provisioning primitive'i          | başarısız invalid-user kalıcı DRAFT/üyelik bırakmaz                                | Başarılı |
| Dar provisioning primitive'i          | başarısız invalid-input kalıcı DRAFT/üyelik bırakmaz                               | Başarılı |
| Dar provisioning primitive'i          | başarısız stale-auth kalıcı DRAFT/üyelik bırakmaz                                  | Başarılı |
| Dar provisioning primitive'i          | başarısız expired-stepup kalıcı DRAFT/üyelik bırakmaz                              | Başarılı |
| Dar provisioning primitive'i          | başarısız expired-session kalıcı DRAFT/üyelik bırakmaz                             | Başarılı |
| Dar provisioning primitive'i          | işlem sonunda simüle hata tüm kurumu/üyeliği/audit'i rollback eder                 | Başarılı |
| Dar provisioning primitive'i          | audit insert hatası bütün provisioning'i rollback eder                             | Başarılı |
| Dar provisioning primitive'i          | eksik function-owner ayrıcalığı fail-closed ve tam rollback                        | Başarılı |
| Dar provisioning primitive'i          | revoked/suspended replay eski tenant'ı yeniden etkinleştirmez                      | Başarılı |
| Dar provisioning primitive'i          | caller sahte GUC ile mevcut tenant'ı hedefleyemez; pooled state temizlenir         | Başarılı |
| Dar provisioning primitive'i          | kota aynı actor lock altında uygulanır; replay kotayı tüketmez                     | Başarılı |
| Üretim kapıları ve güvenli hatalar    | gerçek adapter yokken principal ve provisioning üretilemez                         | Başarılı |
| Üretim kapıları ve güvenli hatalar    | production identity harness ve preview env ile açılamaz                            | Başarılı |
| Üretim kapıları ve güvenli hatalar    | workspace HTTP sınırı kimliksiz 401/no-store döndürür                              | Başarılı |
| Üretim kapıları ve güvenli hatalar    | güvensiz test/reset hedefi reddi                                                   | Başarılı |
| Üretim kapıları ve güvenli hatalar    | güvensiz test/reset hedefi reddi                                                   | Başarılı |
| Üretim kapıları ve güvenli hatalar    | güvensiz test/reset hedefi reddi                                                   | Başarılı |
| Üretim kapıları ve güvenli hatalar    | güvensiz test/reset hedefi reddi                                                   | Başarılı |
| Üretim kapıları ve güvenli hatalar    | runtime config migrator/default bağlantısına düşmez                                | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 23505 güvenli CONFLICT hatasına çevrilir                                        | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 23503 güvenli UNAVAILABLE hatasına çevrilir                                     | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 23514 güvenli UNAVAILABLE hatasına çevrilir                                     | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 40001 güvenli CONFLICT hatasına çevrilir                                        | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 40P01 güvenli CONFLICT hatasına çevrilir                                        | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 42501 güvenli UNAVAILABLE hatasına çevrilir                                     | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 08006 güvenli DEPENDENCY hatasına çevrilir                                      | Başarılı |
| Üretim kapıları ve güvenli hatalar    | DB 22023 güvenli INVALID_INPUT hatasına çevrilir                                   | Başarılı |
| Üretim kapıları ve güvenli hatalar    | güvensiz test/reset hedefi reddi (panel_production_test)                           | Başarılı |

## Sonuçların anlamı

Reddedilme senaryolarında beklenen SQLSTATE: yetki/RLS **42501**, composite FK **23503**,
CHECK/owner/immutable **23514**, duplicate **23505**, serialization **40001**.
RLS okuma veya yabancı satır update/delete senaryosunda sıfır görünür/etkilenen satır
beklenir. Resolver, yok/yetkisiz/revoked/suspended durumlarını aynı UNAVAILABLE hatasına çevirir.
Eksik auth 401/no-store üretir; taklit context WeakMap doğrulamasını geçemez.
Atomic provisioning hatalarında kalıcı Organization/Membership yoktur; replay tek sonuç/tek audit
üretir. Gerçek pool backend PID'siyle A/B/no-context tekrar kullanımı ve rollback temizliği ölçülür.
Üretim MFA/oturum güvenliği çalışıyor diye yorumlanmaz; yalnız kapalı adapter ve sentetik DB primitive'i sınanır.

CI ayrıca boş DB migration zincirini, ikinci deploy'un no-op olmasını ve bu matrisi çalıştırır.
Playwright mevcut dört viewport preview kontrollerine ek olarak sahte HTTP kimlik başlıklarıyla
workspace'in 401 kaldığını sınar. Gerçek login/onboarding/akademik kaynak testleri sonraki fazlardadır.
