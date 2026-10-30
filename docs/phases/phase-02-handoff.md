# Faz 02 — Çok kiracılı altyapı mühendislik devri

## Amaç ve sınır

Onaylı yol haritasındaki DB, kurum kapsamı, `/app/[orgSlug]` workspace yönlendirme temeli ve kurum değiştirme altyapısı. Kimlik doğrulama Faz 03; kurum kurulum/invite yönetim ekranı Faz 05; akademik CRUD Faz 06. Faz 02 gerçek yetki varmış gibi demo role veya browser organizationId kullanamaz.

## Sıralı işler

1. Sorumlular ve sağlayıcı/sürüm kararını kapat; PostgreSQL + Prisma + pooling/adapter uyumunu izole ortamda dene. Gerçek veri/legacy bağlantısı kullanma. `.env.example` yalnız placeholder içerir.
2. Minimum modelleri oluştur: **User, Organization, OrganizationMembership, RoleAssignment, Branch, BranchMembership, AuditLog**. StudentRecord/TeacherRecord ve auth modelleri bu faza eklenmez. Entity tablolarında ileride nullable membership FK eklenmesine uygun `(organizationId,id)` unique anahtarlarını oluştur. RoleAssignment ve BranchMembership surrogate id taşımaz; tam doğal bileşik PK/parent FK/reverse indeksleri DB sözleşmesinden uygula. Organization için createdByUserId, provisioningKeyHash, provisioningRequestHash ve U(createdByUserId,provisioningKeyHash) ilk kurulum makbuzudur.
3. Migration sırası: User + DRAFT Organization → Membership → ownerMembershipId bileşik FK + deferred owner aktifliği trigger'ı → roles/branch grants → audit → CHECK/index/organizationId değişmezliği → runtime grant ve tenant RLS → dar provisioning fonksiyonu, ayrı caller/function-owner grant ve rol bazlı RLS. PUBLIC/runtime EXECUTE kapalı; function-owner NOLOGIN/NOBYPASSRLS ve tablo sahibi değil. Yeni DRAFT/ilk üyelik/owner/ACTIVE/audit tek transaction, test-only principal ile sentetik ortamda doğrulanır; production çağrı kapısı Faz 03/05 öncesi açılmaz. Aynı bootstrap zinciri boş DB'de baştan ve ikinci deploy'da no-op doğrulanır.
4. `src/server/db` server-only client ve transaction wrapper; runtime/migrator rolleri ayrı. Root client domain UI'sına export edilmez. Migration SQL ile Prisma DSL arasındaki partial index/trigger farklarını schema catalog üzerinden doğrula.
5. `src/server/tenant` içinde opaque TenantContext, doğrulanmış principal girişi ve bootstrap organization resolver sözleşmesini oluştur. Auth adapter Faz 03'e kadar mevcut değildir; prod adapter fail-closed döner. Slug yalnız aday seçimidir.
6. Organizations repository tüm metotlarda context ister. DB sorguları org, membership ve şube filtreli; count/updateMany/raw/nested connect dahil güvenlik testleri yaz. RLS transaction-local context ve USING/WITH CHECK testlerini gerçek PostgreSQL runtime rolüyle yap.
7. Workspace route temelini kur: production'da doğrulanmış principal yoksa veri sunma (Faz 03 girişine bağlanmaya hazır kapalı sınır). Route veya switcher mock User ile production erişim açamaz. UI görünümü mevcut AppShell/WorkspaceContext üzerinden korunur; owner/admin menüsü `admin` sunum rolüne map edilir.
8. Organization switching için server resolver `listOrganizationsForPrincipal` ve `resolveWorkspace(principal,slug)` sözleşmesini hazırla; yalnız kendi aktif üyelikleri döner. İstemcinin seçtiği yeni slug her istekte yeniden doğrulanır. Faz 03'e kadar canlı kullanıcı switching kabulü claim edilmez; sentetik integration testiyle sözleşme doğrulanır.
9. Hata davranışı, audit ve geliştirici dokümantasyonunu tamamla; tüm mevcut uygulama kontrollerini çalıştır. UI davranışı değişirse Playwright ve dört viewport QA zorunlu.

## Geliştirme kimlik harness'i

Yalnız test runner tarafından import edilen sentetik principal factory tercih edilir; HTTP header ile kullanıcı/rol enjekte eden route oluşturulmaz. Yerel interactive harness gerekirse ayrı dev giriş modülü, production build'de import yasağı ve `NODE_ENV=production` iken env ne olursa olsun başlatmayı reddetme testi şarttır. `ENABLE_PREVIEW_ROUTES` DB yetkisi veya kimlik harness anahtarı değildir. Gerçek auth olmadan infrastructure ve repository integration testleri güvenle yapılabilir; production veri okuma/yazma veya gerçek onboarding açılamaz.

## Ortam gereksinimleri

Önerilen isimler (Faz 02 seçilen Prisma config'ine eşlenecek): DATABASE_URL runtime pooled URL; DIRECT_URL yalnız migration ortamında; TEST_DATABASE_URL izole CI DB; SHADOW_DATABASE_URL yalnız migrator dev; APP_ORIGIN güvenilir origin; NODE_ENV. Şifre/token secret manager'da; browser bundle'a NEXT_PUBLIC_ ile verilmez. Faz 01 bunları mevcut env dosyasına eklemez ve DB açmaz.

Her CI işi benzersiz boş DB kullanır; test URL'si hedef allowlist ve `_test` adı doğrulamasını geçmeden reset çalışamaz. Prod/staging credential'ları CI unit job'larına verilmez. Sentetik fixture A/B kurumlarıyla sınırlıdır.

## Test ve kabul matrisi

| Senaryo                                                          | Beklenen sonuç                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| User iki kurumda ADMIN ve TEACHER                                | Yalnız seçilen kurum role/grant'ları uygulanır              |
| A membership + B slug                                            | Resolver 404; B id/üye sayısı sızmaz                        |
| A context ile B branch grant veya actorMembershipId yazma        | Bileşik FK reddeder, transaction rollback                   |
| Context olmadan select/insert/update/delete                      | RLS deny; runtime rolünde sıfır satır veya policy hatası    |
| Aynı havuz bağlantısında ardışık A/B/bağlamsız işlemler          | Context sızması yok; rollback sonrası da yok                |
| Tenant id güncelleme / nested connect / bulk / raw SQL           | organizationId değişimi ve cross-tenant ilişki reddedilir   |
| Aynı slug, aynı kurumda yinelenen user/branch code               | Unique ihlali; farklı kurumda branch code mümkün            |
| ACTIVE kurum sahipsiz / owner başka kurumda / sahibi revoke etme | Commit deferred constraint ile başarısız                    |
| Eşzamanlı owner devri                                            | Tek aktif sahip; audit ve değişiklik atomik                 |
| BRANCHES üyesi başka şube veya şubesiz kayda erişir              | Deny; ORGANIZATION üyesi izinli                             |
| Üyelik/kurum suspension, stale context                           | Sonraki işlem deny; yazma öncesi tekrar kontrol             |
| Production harness env=true                                      | Harness yüklenmez veya başlangıç reddi; güvenli fail-closed |

Kabul: migration boş DB'ye kuruluyor; SQL kısıtları catalog'da mevcut; runtime rolü owner/BYPASSRLS değil; tenant testleri geçiyor; rota gerçek auth yokken kapalı; shell/demo/tasarım korunuyor; lint/format/type/test/build ve gerekiyorsa e2e geçiyor. Academic tablolar oluşmadığından öğrenci cross-tenant senaryoları Faz 06'da aynı FK test şablonuyla eklenir.

## Hatalar ve operasyon

DB yoksa 503 ve güvenli retry mesajı; veri yerine mock başarı dönülmez. Context eksikse otomatik ilk kuruma düşülmez. Unique/FK hatası güvenli domain hatasına çevrilir; ham SQL/kimlik bilgisi dönmez. Migration hatasında deploy durur; otomatik db reset yoktur. Tenant içerikli loglar redakte edilir. Açık sağlayıcı ve retention kararları [Faz 01 raporunda](phase-01.md).

## P1 inceleme sonrası ek kabul koşulları

Tam servis sözleşmesi: [ilk kurum kurulumu](../architecture/organization-provisioning.md). TenantContext olmadan yalnız bu dar primitive çağrılabilir; normal kurum repository'sine bypass parametresi eklenmez. Normal runtime'dan Organization INSERT/EXECUTE ve provisioning caller'dan doğrudan DML/SET ROLE denemeleri reddedilmelidir. Function-owner GUC'ları kendisi sıfırlayıp yeni id üretmeli; eski tenant id, rol veya owner parametresi olmamalıdır. Aynı-key paralel oluşturma, farklı payload conflict, başka actor aynı slug, audit/owner/RLS adım hatası ve commit yanıtı kaybı testlerinde tek kurum/üyelik/başarı audit'i veya sıfır kalıcı kayıt beklenir. Replay suspended/archived tenant'ı veya revoke üyeliği yeniden açamaz.

Faz 02 RoleAssignment PK(org,membershipId,role), BranchMembership PK(org,membershipId,branchId) uygular; id/U(org,id) **yoktur**. İkisinde Membership FK(org,membershipId); BranchMembership'te ayrıca Branch FK(org,branchId). Ek indeksler sırasıyla (org,role,membershipId) ve (org,branchId,membershipId). RLS USING/WITH CHECK tenant eşitliği, PK değişmezliği ve grant işlemlerinde server policy/audit zorunludur. Duplicate tam PK, başka kurumda aynı role/branch code, cross-tenant parent FK, bağlamsız CRUD ve yanlış compound-key lookup testleri eklenir. OrganizationInvitationBranch Faz 03, NotificationPreference Faz 07'de kendi doğal PK'larıyla gelir; bunlara id eklemek için altyapı varsayımı kurulmaz.

StudentRecord/Group bu fazda yaratılmaz. Faz 06'ya aktarılan zorunlu senaryolar: null/null ve A/A kabul; null/A, A/null, A/B ve cross-tenant parent red; parent branch değişimi, ended enrollment ve enrollment insert/branch-update yarışı. Nullable branch'i FK'ya ekleyerek null kontrolünü atlamak yasaktır; DB sözleşmesindeki null-safe deferred constraint ve kilit/SERIALIZABLE testleri kullanılır.
