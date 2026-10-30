# RLS uygulaması ve güven sınırı

Bütün yedi tabloda ENABLE/FORCE RLS aktiftir; global User için yalnız kendi identity'sini
okuma politikası vardır. Tenant entity/junction satırlarında organizationId, kök kurumda
id, transaction-local app.organization_id ile metin olarak karşılaştırılır. Eksik, boş veya
geçersiz ayar eşleşmez; UUID cast hatasıyla veri sızmaz. INSERT WITH CHECK ve UPDATE'in
USING/WITH CHECK'i aynı sınırı korur. PUBLIC politikası yoktur.

| Rol                   | Politika ve grant                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| panel_runtime         | Tenant SELECT; Bootstrap'ta yalnız actor'ın membership/organization/identity'si. Organization SELECT makbuz alanlarını içermez; ilk Organization INSERT yoktur. Membership/branch/grant için dar DML; audit yalnız SELECT/INSERT. |
| panel_migrator        | DDL/sahiplik/kısıt denetimi. FORCE altında kendine özel politikalar; hiçbir HTTP bağlantısında kullanılmaz.                                                                                                                       |
| panel_provisioner     | Yalnız security schema USAGE ve tek provisioning fonksiyonunda EXECUTE. Doğrudan tablo DML, DDL, rol geçişi yoktur.                                                                                                               |
| panel_provision_owner | NOLOGIN/NOBYPASSRLS; yeni id/actor/key bazlı provisioning politikaları; branch/role yazamaz, tablo sahibi değildir.                                                                                                               |

Runtime tablo sahibi/superuser/BYPASSRLS değildir; CREATE/TEMP/TRUNCATE veya başka role
SET ROLE yetkisi yoktur. Membership/branch kimlikleri ve receipt alanları trigger ile
değişmez; grant UPDATE yasaktır. Grant INSERT/DELETE membership version artırır.
Audit runtime UPDATE/DELETE alamaz. FK/unique/CHECK/deferred owner kontrolü ORM'den bağımsızdır.

RLS kullanıcı kimliğini kanıtlamaz. Runtime rolüyle keyfi SQL çalıştırabilen saldırgan GUC
ayarlarını taklit edebilir. Güven sınırı doğrulanmış principal + resolver + kaynak yetkisi +
sınırlı grant + scoped repository + validation/audit'tir; RLS bunlara ek savunmadır.
Aynı şekilde provisioning credential'ı sadece dar fonksiyonu kötüye kullanabilir; DB MFA
sağlayıcısı değildir. Üretim kapıları Faz 03/05'e kadar kapalıdır.

Gerçek politika/rol/constraint davranışı [test matrisinde](../security/tenant-isolation-test-matrix.md)
yer alır. Yeni tablo ekleyen migration; composite FK, organizationId değişmezliği, RLS,
least privilege ve adversarial test eklemeden tamamlanmış sayılmaz.
