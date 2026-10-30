# İlk kurum ve sahip üyeliğinin güvenli kurulumu

Bu bir **Faz 01 sözleşmesidir**, çalışan servis/SQL değildir. Normal TenantContext çözümleme mevcut üyelik gerektirir; ilk kurumu yaratmak için onu çağırmak döngü oluşturur. Bu yüzden yalnız yeni kurum yaratabilen dar bir control-plane işlemi tanımlanır. Mevcut tenant'a erişim veya genel RLS bypass sağlamaz.

## createOrganizationWithOwner sözleşmesi

`createOrganizationWithOwner(principal: VerifiedPrincipal, input: {name, slug, type, idempotencyKey}, requestId) → {organizationId, ownerMembershipId, slug, replayed}`.

VerifiedPrincipal yalnız Faz 03 sunucu auth adapter'ından gelir: mevcut ACTIVE User, doğrulanmış e-posta, geçerli/iptal edilmemiş oturum ve authVersion, **AAL2 eşdeğeri MFA** ve son 15 dakika içinde step-up. MFA kurulumu kurum gerektirmeyen hesap güvenliği akışında tamamlanır; henüz kurum sahibi olmaması bu şartı kaldırmaz. AAL2 sağlayıcının doğruladığı çok faktörlü törenin uygulama karşılığıdır; istemcinin gönderdiği `aal`, rol veya timestamp kabul edilmez. DB fonksiyonu bir kimlik sağlayıcı değildir; principal/assurance doğrulamasının güven sınırı bu sunucu adapter'ıdır.

User önceden vardır; servis kullanıcı yaratmaz, başka kişiyi sahip seçmez ve başkasının hesabıyla kurum açmaz. Aktif TenantContext, mevcut ADMIN veya platform rolü gerekmez. İstemci input'unda organizationId, owner/user/membership id, status, roller, policy/SQL veya genel callback yoktur. DB çağrısının actorUserId/authVersion argümanlarını yalnız sunucu VerifiedPrincipal'dan türetir; bunlar istemcinin owner seçme parametresi değildir. Name/slug/type allowlist ile normalize edilir. Slug benzersizliği hatası mevcut kurum kimliğini/sahibini ifşa etmez. Girişte same-origin/CSRF, actor tabanlı rate limit ve sunucu kurum oluşturma kotası uygulanır; idempotent replay kotayı tekrar tüketmez.

## Dar DB yetki sınırı ve RLS

Önerilen DB işlemi, ayrı güvenilir şemada sabit gövdeli bir `SECURITY DEFINER` fonksiyonudur; tek iş Organization ve kendi owner Membership'ini atomik kurmaktır. Uygulama servisi yalnız bu fonksiyonu parametreli sabit çağrıyla çağırır; SQL/Prisma transaction callback'ini çağırana açmaz.

| DB rolü                     | Yetki                                                                                                  | Açıkça yasak                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Normal tenant runtime       | Normal repository grant'ları ve tenant RLS                                                             | İlk Organization INSERT; provisioning fonksiyonunda EXECUTE; provisioning rolüne SET ROLE                             |
| Provisioning caller         | Ayrı server-only bağlantı; yalnız güvenilir şema USAGE ve bu fonksiyonda EXECUTE                       | Tablolarda doğrudan SELECT/INSERT/UPDATE/DELETE, diğer uygulama fonksiyonlarında EXECUTE, rol üyeliği, DDL, BYPASSRLS |
| Provisioning function owner | NOLOGIN, NOBYPASSRLS, superuser/tablo sahibi değil; gereken dar kolon grant'ları ve kendisine özel RLS | Akademik tablolar, Branch/RoleAssignment yazma, User yazma, DELETE/TRUNCATE, DDL, migration yetkisi                   |
| Migrator                    | Fonksiyon/grant/policy kurulumu                                                                        | Web isteği veya provisioning için credential'ının kullanılması                                                        |

Fonksiyon sahibine gereken erişimler: User'da yalnız id/status/authVersion okuma; Organization'da aşağıda tanımlı SELECT/INSERT ve yalnız ownerMembershipId/status güncelleme; Membership'te yalnız SELECT/INSERT; AuditLog'da yalnız INSERT. Tenant tablolarında ENABLE/FORCE RLS açık kalır. `PUBLIC` ve runtime için EXECUTE varsayılan grant'ları kaldırılır; güvenilir şemada CREATE verilmez. Fonksiyon sabit güvenli `search_path` kullanır, tüm tablo/fonksiyon referansları şema niteliklidir; dinamik SQL ve kullanıcı kontrollü nesne adı yoktur. Fonksiyon sahibi/caller rolleri birbirine veya runtime'a üyelik vermez. Grant ve policy kurulumları tek migration transaction'ında yayınlanır. Tasarım dayanağı: [PostgreSQL SECURITY DEFINER güvenliği](https://www.postgresql.org/docs/17/sql-createfunction.html), [RLS rol sınırları](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

Fonksiyon girişte caller'ın koymuş olabileceği tüm provisioning ayarlarını sıfırlar; trusted principal'dan gelen actor ve normalize anahtarı kendi transaction-local ayarlarına yazar. `newOrganizationId` ve Membership id'sini fonksiyon üretir. RLS politikaları **yalnız function-owner rolüne** uygulanır; runtime'ın ayarları taklit etmesi bu grant/policy'leri kazanmasını sağlamaz. Normal tenant politikaları bu role miras kalmaz; `TO PUBLIC USING(true)` benzeri policy yoktur.

- Organization INSERT WITH CHECK: id = fonksiyonun ürettiği yeni id, createdByUserId = actor, provisioningKeyHash = bu istek, status=DRAFT ve ownerMembershipId null.
- Organization SELECT USING: creator + bu idempotency key; yalnız yeni kurum veya aynı işlemin replay kaydı. Tek ek okuma, fonksiyonun kendi açıp hemen kapattığı QUOTA evresinde aynı creator için yalnız COUNT hesaplamasıdır; sabit gövde satır/tenant verisi döndürmez. QUOTA evresi runtime/caller tarafından açılamaz ve hiçbir UPDATE/INSERT kapsamını genişletmez. UPDATE USING/WITH CHECK: yalnız **bu çağrıda yeni üretilmiş id**, aynı creator/key ve DRAFT→ACTIVE/owner atama yolu. Replay için new-id ayarı boş kalır; mevcut kurum yeniden etkinleştirilemez.
- Membership INSERT WITH CHECK: organizationId = yeni id, userId = actor, status=ACTIVE, accessScope=ORGANIZATION. SELECT USING: yalnız yeni veya replay kurumundaki aynı actor üyeliği. Başka üyeye erişim/grant yoktur.
- AuditLog INSERT WITH CHECK: organizationId = yeni id, actorUserId = actor ve actorMembershipId = yeni owner; action yalnız `organization.provisioned`. Replay yeni iş audit'i yaratmaz.
- Ayar eksik/boş/geçersizse deny; oturum düzeyinde SET ve `row_security=off` yok. Commit/rollback sonrasında provisioning ayarları yeniden kullanılamaz. Hata yakalandığında caller aynı açık transaction'da başka SQL çalıştırmaz; bütünü rollback eder ve bağlantıyı iade eder.

Bu privilege elevation dar bir işlemdir; genel tenant seçme/okuma/yazma yetkisi değildir. Provisioning caller credential'ı ele geçirilirse saldırgan bu dar fonksiyonu kötüye kullanabilir; credential'ın server-only tutulması, principal doğrulama, kota ve izleme güven sınırıdır. Bunlar DB'nin MFA doğruladığı iddiasına dönüştürülmez.

## Tek transaction ve durum sırası

1. Servis principal/assurance ve input'u doğrular; provisioning bağlantısında kısa **SERIALIZABLE** transaction başlatır. Dış auth, mail, storage veya ödeme çağrısı transaction içinde yapılmaz.
2. Fonksiyon User.status/authVersion'ı principal ile karşılaştırır. Aktör bazlı transaction advisory lock alır; aynı actor'ın oluşturma/kota/replay işlemleri seri olur. Hash çakışması yalnız gereksiz bekleme yaratır, izin genişletmez. Servis sözleşmesini kullanan tüm ilk-kurum oluşturma yolları bu kilide uyar.
3. `(createdByUserId, provisioningKeyHash)` kaydını arar. Aynı anahtar + aynı normalize istek hash'i varsa yalnız replay yolu; farklı hash 409. Kayıt yoksa QUOTA evresinde yalnız actor'ın createdByUserId eşleşen kurumlarını sayıp yeni kurum kotasını DB'de aynı kilit altında kontrol eder; evreyi hemen kapatır. Kota için akademik veri veya başka creator'ın kurumları okunmaz. Kota değeri Faz 05 ürün kararıdır; politika sağlanmıyorsa oluşturma fail-closed olur.
4. Yeni UUID ile **DRAFT Organization**, ownerMembershipId=null ve değişmez provisioning metadata oluşturur. DRAFT hiçbir normal workspace sorgusuna açılmaz. Aynı transaction içinde bu actor için ACTIVE/ORGANIZATION Membership oluşturur; OWNER rol satırı yaratılmaz. Başlangıç RoleAssignment/BranchMembership kümesi boştur: sahip yetkileri ownerMembershipId'den hesaplanır.
5. `(Organization.id, ownerMembershipId) → OrganizationMembership(organizationId,id)` FK'sına uygun ownerMembershipId atanır; sonra status=ACTIVE yapılır. Tenant AuditLog'a tek `organization.provisioned` olayı eklenir. Deferred constraint'ler owner'ın aynı kurumda ACTIVE/ORGANIZATION olmasını doğrular. Sonuç ancak **commit başarılı olduktan sonra** dışarı verilir.
6. Normal runtime bağlantısında principal + dönen slug ile üyelik resolver'ı yeniden çalışır; ancak bundan sonra normal TenantContext üretilir. Fonksiyon sonuç kimlikleri veya provisioning context'i yetki kanıtı sayılmaz.

DRAFT, Membership, owner atama, ACTIVE ve başarı audit'i aynı transaction'dadır. Herhangi bir adım/FK/RLS/audit/commit hatasında hepsi rollback olur; kalıcı yarım DRAFT beklenen sonuç değildir. İşlem başlamadan/işlem sırasında iptal edilen oturum sonraki istek/retry'da yeniden doğrulanır; önceden doğrulanmış ve başlamış işin iptalle yarışması daha önce tanımlanmış istek sınırı kuralına tabidir, eski principal yeni bir çağrı için tekrar kullanılamaz.

## İdempotency ve eşzamanlılık

Organization'a Faz 02'de yalnız bu servisçe yazılan değişmez `createdByUserId → global User.id`, `provisioningKeyHash`, `provisioningRequestHash` eklenir. U(createdByUserId,provisioningKeyHash) replay makbuzudur; ayrı genel bypass/receipt tablosu gerekmez. İdempotency key en az 128-bit rastgele değer; logda düz tutulmaz. Normalize name/slug/type ve sözleşme sürümünden hesaplanan request hash anahtara bağlanır; DB fonksiyonu gerçek normalize argümanlardan hash'i hesaplar/doğrular. Aynı key farklı actor için farklı işlemdir; slug yine global unique'dir. Aynı intent için istemci retry'da aynı key'i kullanır; yeni key yeni oluşturma isteğidir.

Replay yalnız aynı actor+key+digest kaydını bulabilir ve salt okunur sonuç verir. Membership'in hâlâ ACTIVE olması ve kurumun ACTIVE olması kontrol edilir; owner devredilmiş ama üyelik hâlâ aktifse dönen ownerMembershipId yalnız tarihsel ilk üyelik kimliğidir, yeni sahiplik yetkisi vermez. Üyelik revoke edilmiş veya kurum suspended/archived ise genel unavailable hatası verilir; yeniden oluşturma, owner atama veya aktif etme yapılmaz. TenantContext her durumda normal resolver'dan gelir.

Aynı actor/key eşzamanlı çağrılar tek kurum/üyelik/audit üretir; actor lock + unique kısıt bunun iki savunmasıdır. SERIALIZABLE snapshot nedeniyle bekleyen çağrı serialization/unique hatası alırsa transaction tamamen rollback edilip en çok üç jitter'lı retry yeni snapshot'ta aynı key ile yapılır. Farklı actor aynı slug'ı isterse biri başarılı, diğeri güvenli 409 alır. Unique hatası kısmi kaydı kurtarmak için filtre dışı SELECT'e dönüşmez.

İlk kurulum makbuzu alanları NOT NULL ve değişmezdir; normal runtime bunları DTO/export veya ayarlarda göstermez. ownerMembershipId sonuç alanı ilk kurulan actor üyeliğini ifade eder, güncel sahiplik kaynağı olarak kullanılamaz; replay bu üyeliği yeniden doğrular. Metadata kurum ömrü boyunca korunur; normal update, owner devri veya hesap anonimleştirme actor referansını/key'i değiştirmez. İleride onaylı fiziksel tenant purge bu replay garantisinin sınırıdır: eski key ile yeni kurum açılmasını önleyecek tombstone/retention kararı alınmadan purge açılmaz. Bu dar sınır, MVP'deki arşivleme ile karıştırılmaz.

## Audit, hata ve kurtarma

Başarı tenant audit'i: actorUserId, actorMembershipId, organizationId, requestId, eylem, sözleşme sürümü, assurance türü/zamanı ve key hash. Token/MFA secret'ı veya oturum cookie'si saklanmaz. Audit yazılamazsa kurum kurulumu da commit olamaz. Başarısız/reddedilen deneme rollback sonrası ayrı redakte güvenlik telemetry'sine gider; olmayan tenant için sahte başarı AuditLog'u yazılmaz. Faz 03'te global güvenlik kayıtları PlatformAuditLog'a bağlanır; fonksiyon sahibine oraya yazma yetkisi verilmez.

| Hata / kurtarma                                 | Sözleşme                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Oturum/email/MFA/step-up yetersiz               | DB fonksiyonu çağrılmaz; sign-in/verification/step-up gereği döner                                                       |
| DB izni/RLS/FK/audit veya deferred owner hatası | Tam rollback; güvenli hata; aynı key ile tekrar denenebilir; servis geniş grant açmaz                                    |
| Ağ kopması / commit sonucu belirsiz             | Yeni transaction'da aynı key+input+yeniden doğrulanmış principal ile replay; ikinci kurum açılmaz                        |
| Aynı key farklı input / başka actor'ın slug'ı   | 409; mevcut tenant kimliği ve üyeleri açıklanmaz                                                                         |
| Serialization/deadlock/lock timeout             | Tam rollback, sınırlı retry; sonra retry edilebilir 409/503; kısmi DRAFT onarılmaz                                       |
| Commit sonrası yönlendirme/mail sorunu          | Kurum kalır; replay + normal resolver ile devam; mail için DB rollback taklit edilmez                                    |
| Kalıcı DRAFT veya eksik owner gözlenmesi        | Invariant ihlali olarak alarm ve inceleme; genel “DRAFT sahiplen” endpoint'i yok; yeni servis mevcut kurumu hedefleyemez |

## Fazlar ve kabul kanıtı

- **Faz 02:** metadata unique/FK, dar DB primitive/grant/RLS ve atomik rollback/idempotency sözleşmesi yalnız sentetik izole DB testleriyle uygulanabilir. Production principal adapter'ı kapalı; halka açık provisioning veya gerçek onboarding yok.
- **Faz 03:** VerifiedPrincipal, e-posta doğrulama, MFA/step-up ve revoked/expired/authVersion kontrollerini sağlar; sunucu servis kapısı bağlanabilir, Faz 05'e kadar public kurum yaratma akışı kapalıdır.
- **Faz 05:** `/kurulum` arayüzü bu tek servisi kullanır; ürün kota politikası, kullanıcı hataları ve belirsiz commit retry UX'i tamamlanır. İlk kurum için mevcut tenant guard istenmez; principal+assurance zorunluluğu korunur.

Kabul testleri: normal runtime/caller doğrudan DML ve SET ROLE reddi; runtime'dan EXECUTE reddi; taklit edilmiş GUC'larla eski tenant okuma/yazma reddi; istemcinin existing organizationId/hedef ownerUserId/rol parametresiyle servisin principal eşlemesini değiştirememesi; her adımda hata/audit/commit hatası enjeksiyonunda sıfır kalıcı kurum/üyelik; aynı-key paralel retry tek başarı audit'i; farklı input conflict; farklı actor aynı slug; commit-response kaybında replay; revoked membership/suspended org replay'inde reactivation yok; commit/rollback sonrası pooled bağlantıda context sızıntısı yok; MFA/expiry/revoke sahte principal reddi. Bu testler Faz 01'de çalıştırılmamış, uygulama kabul gereksinimleridir.
