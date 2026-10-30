# Çok kiracılı veri mimarisi

## Seçenek değerlendirmesi

| Ölçüt               | Ortak DB / ortak tablolar                                      | Kuruma özel schema                                     | Kuruma özel DB                                  |
| ------------------- | -------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Güvenlik            | DAL + FK + RLS ile satır sınırı; yanlış kapsam riski           | Schema yetkileri; search_path ve bağlantı seçimi riski | Güçlü fiziksel ayrım; yanlış bağlantı riski     |
| Maliyet / operasyon | En düşük, tek migration zinciri                                | Binlerce schema migration yükü                         | Her kurum için bağlantı, yedek, migration yükü  |
| Prisma / sorgu      | Tek client, bileşik anahtarlar                                 | Dinamik tenant schema yönlendirme karmaşık             | Client/connection havuzu tenant sayısıyla büyür |
| Ölçek               | İndeks + kota + sorgu bütçesi; noisy neighbor izlenir          | Aynı DB kaynakları paylaşılır                          | Kurum bazlı kapasite mümkün                     |
| Yedek / geri dönüş  | Fiziksel kurtarma tüm DB; tenant kurtarma ayrı mantıksal işlem | Schema export mümkün, ilişkiler kontrol edilir         | Kurum bazlı restore daha kolay                  |
| Taşıma / bakım      | Tek sürüm, kontrollü export                                    | Her schema sürümünü takip etme                         | Filo yönetimi ve sürüm sapması                  |
| Enterprise          | Gerekirse sonradan ayrıştırılabilir                            | Orta düzey ayrım                                       | Sözleşmeli ayrı kaynak için uygun               |

**Karar:** MVP ortak PostgreSQL, ortak tablolar, zorunlu organizationId; DAL + bileşik FK, tenant tablolarda RLS. PostgreSQL RLS satır görünürlüğü içindir; kaynak/alan yetkilendirmesi değildir. Ayrı DB enterprise seçeneği kullanım kanıtı ve sözleşme olduğunda yeni ADR gerektirir. Tenant routing registry veya shard yöneticisi şimdi oluşturulmaz.

## Değişmez kurallar

- Her tenant satırının tek, null olmayan organizationId'si vardır; kök Organization için id tenant kimliğidir. Global tablolar yalnız database-design.md'de açıkça listelenenlerdir.
- Tenant hedeflerinde `(organizationId,id)` unique; tüm tenant→tenant FK'larda organizationId bulunur. Membership → User, Subscription → Plan gibi tenant→global ilişkiler açık istisnadır. Ters yönde tenant verisi kendiliğinden okunamaz.
- organizationId güncellemesi yasaktır; başka kuruma taşıma kontrollü export/import'tur. FK güncellemeleri RESTRICT; tenant ilişkileri varsayılan silmede RESTRICT.
- Tüm sorgular select/include/count/aggregate/updateMany/deleteMany, iç içe create/connect ve raw SQL dahil doğrulanmış TenantContext ve aynı transaction kullanır. Girdi içindeki organizationId filtreye yayılmaz; sunucu tarafından yazılır.
- Repository root Prisma client'ı dışarı çıkarmaz. `findById(ctx,id)` kurum + kaynak kapsamıyla sorgular; tenant id'si olmayan overload yoktur. ORM extension tek başına güvenlik sınırı değildir; nested write davranışı ayrıca test edilir.
- Yönetici sadece kendi kurumunda geniş kapsam alır. Platform rolü tenant repository'sini atlatmaz; destek erişimi süreli, gerekçeli, denetimli ayrı yetki gerektirir (Faz 10).

## RLS uygulama sözleşmesi (Faz 02)

Tenant tablolarda ENABLE ve FORCE ROW LEVEL SECURITY; USING ve WITH CHECK aynı doğrulanmış kurum bağlamını kullanır. Bağlam transaction başında parametreli `set_config('app.organization_id', orgId, true)` ile ayarlanır; session düzeyinde SET kullanılmaz. Eksik ayar deny üretir. Runtime rolü tablo sahibi, superuser veya BYPASSRLS olamaz; TRUNCATE/DDL yetkisi yoktur. Migration rolü farklıdır. Global kimlik tablolarına erişim yalnız dar identity repository'sinden gelir.

Bağlamı hazırlamak için gereken Organization slug + Membership + BranchMembership + RoleAssignment okumaları dar bootstrap transaction'ında aday tenant id ile yapılır. Bu adım yalnız oturumdaki User'a ait üyeliği ve kurum durumunu doğrular; doğrulanmadan akademik sorguya izin verilmez. Aday slug veya header erişim kanıtı sayılmaz. Bootstrap sonucu doğrulanmış opaque TenantContext üretir. RLS yanlışlıkla başka kuruma filtre konmasını azaltır; uygulamanın keyfi context ayarlayabilen DB rolüyle tamamen ele geçirilmesine çözüm değildir.

Tablo sahibi RLS'yi normalde atlayabilir; FORCE bu davranışı sınırlar, superuser/BYPASSRLS yine atlar. Bu nedenle testler migration rolüyle yapılmaz. Resmî kaynak: [PostgreSQL RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

## Diğer veri yolları

Job payload organizationId + iş türü + opaque id içerir; çalıştırıcı güvenilir servis kimliği ve yetki kapsamını yeniden doğrular. Kullanıcı adına yapılan işte üyelik/ilişki iptali tekrar kontrol edilir. Tenant başına ayrı transaction ve sınırlı batch; tüm kurumlar için tek geniş context yoktur.

Dosyalar private depoda `organizations/{orgId}/{opaqueId}` anahtarıyla saklanır; prefix yetki sağlamaz. Metadata sorgusu tenant + kaynak kapsamlıdır; dosya servisi doğrulama sonrası proxy veya en fazla 60 saniyelik URL verir. URL iptal penceresi kabul edilmezse proxy zorunludur. Ortak CDN'de hassas içerik cache'lenmez.

Export oluşturma ve indirme anında aynı yetki yeniden kontrol edilir. CSV formül enjeksiyonu kaçışlanır; özel notlar varsayılan dışarıda kalır. Audit tenant kapsamlıdır; actor kimliği, action, kaynak tipi/id, requestId ve redakte metadata içerir. Token, parola veya özel not metni loglanmaz. Cache anahtarı kurum + üyelik + policy sürümü + kaynak kapsamı içerir; ilk MVP hassas sorgularda no-store kullanır.

Tek tenant restore, yedeği ayrı güvenli ortama açıp yalnız yetkili kurum satırlarını ilişkisel doğrulayarak geri yükleme planıdır; üretimin tüm DB'sini eskiye almak değildir. Bu işlem Faz 11 tatbikatına tabidir.

## İptal ve eşzamanlı yazma

Yetkili mutation transaction'ı aktif Organization/Membership satırlarını ve kullanılan grant/ilişkiyi doğrular; üyelik/kurum revocation ile yarışan yazmalar için aynı satırlar uygun paylaşım kilidiyle sabitlenir. İptal işlemi bu satırları exclusive günceller; kilit sırası Organization → Membership → kaynak şeklindedir. Böylece revoke commit'inden sonra eski context ile yeni yazma commit edemez. Önceden başlamış bir yetkili işlem iptalden önce tamamlanabilir; bu sıra audit'te görünür. Rol ve branch grant değişimi membership version artırıp aynı lock protokolünü izler. İstekler arası context reuse yoktur.

Billing webhook'unda body organizationId'si kabul edilmez: doğrulanmış provider imzası ve server'da kayıtlı externalId → Subscription → Organization eşlemesiyle servis context'i üretilir. U(provider,eventId) tekrarı, payloadHash farklılığı conflict ve sıra dışı event'ler subscription version/state kontrolüyle işlenir. Akademik erişim için webhook'tan kullanıcı yetkisi türetilmez.
