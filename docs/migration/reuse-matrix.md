# Yeniden kullanım matrisi

Kaynakların commit’e sabitlenmiş konumları ve model bazlı gerekçeler [envanterde](legacy-inventory.md). Bu fazda kaynak kod kopyalanmamıştır. REUSE bile lisans/sahiplik ve bağımlılık incelemesinden sonra ilgili fazda taşınabilir.

| Modül / kaynak                                                     | Sınıf    | Yeniden kullanılabilir parça                                 | Değişiklik / gerekçe / teslim fazı                                                       |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `lib/panel/lesson-series-schedule.ts`                              | REFACTOR | Saf tekrar üretimi ve ortak preview/create resolver          | Sabit İstanbul varsayımını IANA timezone sözleşmesine göre sınırla; 06                   |
| `lib/panel/lesson-series-schedule.test.ts`                         | REUSE    | Aynı girdiden preview/create eşitliği test senaryoları       | Yeni model fixture ve import yollarıyla; 06                                              |
| `lib/panel/mock-exam-core.ts`                                      | REFACTOR | Sıralamadan bağımsız revision/digest algoritması             | Eski Prisma enum bağımlılığını çıkar; tenant/actor idempotency kapsamı ekle; 08          |
| `lib/panel/group-management-service.ts`                            | REFACTOR | Kilit sırası, transaction receipt ve payload digest ilkeleri | Tüm sorguları tenant repository'ye taşı; kapasite sabitini kaldır; 06                    |
| `lib/auth/resource-scopes.ts` + test                               | REWRITE  | Canlı veli ilişkisi + enrollment iş kuralı                   | Global ADMIN boş scope güvenli değil; tenant ve kategori kapsamları baştan; 03/07        |
| `lib/auth/session.ts`, `session-policy.ts`                         | REFACTOR | Opak token hash, revoke ve süre kontrolü                     | Sağlayıcı kararı + üyelikten bağımsız kimlik; kaynak koddan farklı açık süre kararı; 03  |
| `lib/auth/invitation.ts`                                           | REFACTOR | Rastgele token, hash, expiry algoritması                     | User üstünde davet yerine OrganizationInvitation; güvenilir origin allowlist; 03         |
| `lib/auth/guards.ts`, `products.ts`                                | REWRITE  | Her sunucu veri sınırında guard ilkesi                       | Global role, OD/OK/ODK pilot/product ve overlay kurgusu yeni tenant için uygun değil; 03 |
| `lib/panel/education-handlers/assignment-submissions-id-review.ts` | REFACTOR | Optimistic version, tek karar, rubric tamlığı iş kuralı      | Alan servisine ayır, same-tenant FK, DTO, kapsam içi update; 06                          |
| `app/api/panel/materials/[id]/file/route.ts`                       | REFACTOR | Metadata yetkisi sonrası private proxy UI/API örüntüsü       | Eski provider, token ve rol bağımlılıklarını çıkar; 06                                   |
| `lib/panel/parent-scope.ts`, `parent-calm.ts`                      | REFACTOR | Seçili çocuğu açık bağdan çözme, güvenli özet dili           | Kategori izinleri, kurum kaydı ve guardian DTO; 07                                       |
| `app/panel/*`, mevcut legacy tasarım                               | EXCLUDE  | Eğitim akışları yalnız davranış referansı                    | Hedef onaylı tasarım sistemi değişmez; UI markup/CSS kopyalanmaz                         |
| `prisma/schema/auth.prisma`, `education.prisma`                    | REWRITE  | Alan sözlüğü ve ilişki ihtiyaçları                           | Şema topluca taşınmaz; global User.role/1:1 profiller/sabit kapasite kaldırılır          |
| `commerce.prisma`, `business.prisma`, ürün pilotları               | EXCLUDE  | İdempotent event fikri kavramsal olarak yararlı              | B2C satış, CRM, Instagram ve finans ürüne dahil değil                                    |
| `odk.prisma` canlı exam runner, `kocum.prisma` adaptif plan        | DEFER    | Deneme ve koçluk ileri senaryoları                           | Temel model önce; 08 veya ayrı ürün kapsamı onayı                                        |
| `system.prisma` mastery/evidence projeksiyonları                   | DEFER    | Türetilmiş metriğin kaynak/sürüm izlenebilirliği             | Ölçülmüş performans gereksinimi olmadan yeni tablo yok                                   |

REUSE saf algoritma/test senaryosu; REFACTOR yararlı kural fakat değişecek bağımlılık; REWRITE yeni güvenlik/sahiplik modeli; EXCLUDE ürün dışı; DEFER ileri fazda yeniden karar demektir. Hiçbiri gerçek müşteri verisi taşıma izni değildir.
