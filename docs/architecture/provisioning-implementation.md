# Dar kurum kurulum primitive'i

`202610300003_provisioning` migration'ı `security.create_organization` fonksiyonunu kurar.
Sahibi panel_provision_owner; güvenli search_path=pg_catalog, schema-qualified sabit SQL,
PUBLIC/runtime EXECUTE kapalıdır. Caller yalnız fonksiyon çalıştırır; hiçbir tablo DML grant'ı yoktur.

Argümanlar sunucu principal'ından actor/authVersion/stepUp/expiry; doğrulanmış input'tan
name/slug/type/idempotency UUID; sunucudan request UUID'dir. Existing organization, hedef
owner, rol veya SQL argümanı yoktur. Email/MFA/session doğrulaması gerçek auth adapter'ının
sorumluluğudur; timestamp argümanları tek başına doğrulanmış MFA değildir.

Fonksiyon caller GUC'larını sıfırlar, ACTIVE User/authVersion ve assurance zamanlarını
kontrol eder, actor advisory transaction lock alır. Normalize payload ve UUID key için
PostgreSQL sha256 ile digest üretir; unique creator/key receipt kontrol edilir.
Aynı payload replay'i yalnız mevcut ACTIVE kurum ve halen ACTIVE actor üyeliğini döndürür;
owner devredilmişse ilk actor üyeliği döner, sahiplik yetkisi türetilmez. Farklı payload
conflict'tir. QUOTA evresi yalnız aynı creator'ın count hesabını açar ve hemen kapanır.

Yeni UUID'ler fonksiyon içinde üretilir. DRAFT kurum → ACTIVE/ORGANIZATION üyelik →
owner atama + ACTIVE → redakte tek audit aynı SERIALIZABLE transaction'dadır. DRAFT/owner
ara durumu dışarı görünmez. Başarı yalnız caller COMMIT'i tamamlandıktan sonra döner.
Deferred constraint veya audit hatası tüm zinciri geri alır; yarım kurum onarımı yoktur.
Replay mutation yapmaz; revoked/suspended kayıt açılmaz. Rol/grant kümesi başlangıçta boştur.

`createOrganizationWithOwner` production servis imzası mevcuttur ama koşulsuz fail-closed'dur.
Ortam değişkeni veya preview ayarı bu kapıyı açamaz. Test çağrısı yalnız
`tests/integration/helpers/database.ts` içindeki sentetik SERIALIZABLE harness'tedir.
En çok üç 40001/40P01 retry aynı key'i korur; her başarısız deneme rollback + release yapar.

Veritabanı kotasının varsayılanı sıfırdır. İzole test hazırlayıcısı 5 yapar. Faz 03/05;
production servis kapısını açmadan principal/session/email/MFA, 15 dakika step-up,
same-origin/CSRF, actor rate limit, ürün kotası ve güvenli hata/telemetri eklemelidir.
Physical purge/tombstone ve hukuki retention kararı kapatılmadan receipt silinmez.
