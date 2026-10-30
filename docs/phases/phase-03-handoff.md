# Faz 03 — Kimlik doğrulama ve izinler mühendislik devri

Faz 02'nin User/Membership/RoleAssignment/BranchMembership anahtarları korunur. Login/kayıt, oturum, üyelik rol değerlendirmesi, hesap ayarları ve çıkış uygulanır. Davet kabulünün güvenli servis sözleşmesi bu fazda; kurum kurulum/davet yönetim ekranı Faz 05; veli akademik ekranı ve canlı ilişkinin açılması Faz 07'dir.

## Sağlayıcı kararı

| Seçenek                             | Kazanım                                            | Maliyet / risk                                                            | Karar                                                                 |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Yönetilen OIDC kimlik sağlayıcı     | Kurtarma, MFA ve credential yaşam döngüsü dışarıda | Veri bölgesi/alt işleyen/maliyet, subject eşleme, vendor bağımlılığı      | İlk tercih; Faz 03 başlangıcında bölge ve sözleşme doğrulamasıyla seç |
| Uygulama içi olgun auth kütüphanesi | DB ve session politikası üzerinde kontrol          | Güvenlik güncellemeleri ve mail/credential işletimi ekibin sorumluluğunda | Yönetilen sağlayıcı uygun değilse ikinci seçenek                      |
| Sıfırdan özel auth                  | Tam kontrol                                        | Parola/MFA/kurtarma hatası riski, işletim yükü                            | MVP için reddedildi                                                   |

Belirli sağlayıcı henüz onaylı değildir; dış hesap açılmaz. UserIdentity(provider,subject) uygulama User'ına map edilir. Sağlayıcı org/role claim'i uygulama üyeliği yerine kullanılmaz. Sağlayıcı değişimi akademik tablo tasarımını değiştirmez. Parola kullanılırsa sağlayıcı/kütüphane güncel güvenli hashing uygular; legacy passwordHash taşınmaz. Hesap recovery token'ı yalnız hash, tek kullanımlık, kısa ömürlü (öneri 30 dakika); yanıtlar kullanıcı varlığını ifşa etmez. E-posta değişimi tekrar doğrulama ve step-up ister.

## Sıralı uygulama

1. Kimlik sağlayıcı ADR'sini kapat; yalnız staging/test tenant'ında protokol ve logout/revoke davranışını doğrula. Callback redirect allowlist ve server-only config kullan.
2. UserIdentity, Session, RecoveryToken, PlatformRoleAssignment, OrganizationInvitation, OrganizationInvitationBranch, PlatformAuditLog modellerini ekle. Yerel Session kullanılacaksa rastgele 256-bit token; yalnız hash sakla. Dış oturum doğrulandıktan sonra uygulama session adaptörü açılır. Provider MFA secret'ı uygulamaya kopyalanmaz.
3. Session cookie HttpOnly, Secure, SameSite=Lax; login/step-up sonrası rotate; logout revoke + cookie clear. Tasarım varsayımı: mutlak 24 saat, idle 2 saat; ayrıcalıklı işlem için son 15 dakikada MFA. Çoklu rollerin en yüksek ayrıcalığı MFA gerektirir. Provider daha kısa sınır uygularsa kısa olan geçerli. Süreler ürün/güvenlik tarafından Faz 03 başlangıcında onaylanır.
4. Owner, ADMIN ve SUPER_ADMIN için MFA zorunlu; öğretmenler için desteklenir, kurum politikasıyla zorunlu yapılabilir. Sahiplik devri, toplu export, parola/e-posta/MFA değişikliği ve platform işlemleri fresh step-up gerektirir. Recovery MFA'yı sessiz bypass etmez; kurtarma kodu tek kullanımlık ve denetimli veya provider'ın eşdeğer güvenli akışı gerekir.
5. Davet oluştur/yenile/iptal/kabul servisleri: 72 saat token önerisi, e-posta doğrulama, rol ve şube kapsamı kontrolü, atomik tüketim. Aynı email için pending davet yenilenirken eski hash iptal edilir. Başka e-posta ile kabul reddedilir; kullanıcı varlığı kuruma ifşa edilmez.
6. Aktif Membership resolver'ını Faz 02 production adapter'ına bağla. Multi-org listesi yalnız kullanıcıya ait aktif üyelikler; orgSlug/cookie seçimi güvenilir yetki kaynağı değildir. Seçili kurum erişimi biterse 404/kurum seçimi; ilk kuruma sessiz geçiş yok.
7. [İzin matrisi](../architecture/permission-matrix.md) action sabitlerini ve scope resolver'larını uygula. `authorize` hem route/action hem alan servisinde kullanılır; kaynak yüklemesi yetki koşuluyla tek sorgudadır. Organization ownerMembershipId ayrı sahiplik kaynağı kalır.
8. Guardian access policy sözleşmesini sentetik DTO/fixture ile doğrula. GuardianRecord/ilişki tabloları Faz 07'de ekleneceğinden PARENT rolü tek başına hiçbir öğrenci verisi açamaz. İleriki adapter gerçek aktif/verified ilişki ve kategori izni olmadan fail-closed döner; dummy child id kullanılmaz.
9. Üyelik/rol/şube değişimi version artırır, sonraki istekte yeniden okunur; uzun iş adımları tekrar doğrular. Password reset / hesap suspension authVersion artırır ve tüm Session'ları revoke eder. Üyelik iptali diğer kurum üyeliklerini kapatmaz.
10. Mevcut login tasarımını onaylı prototipe uygun uygula; veri/kimlik/shell bağlamını server'dan üret. UI role seçimi yetkiyi etkilemez. Account settings/sign-out davranışını uçtan uca doğrula.

## Güvenlik ve kabul testleri

- Session yok/sahte/expired/revoked/User suspended/authVersion eski: veri yok. Replay ve session fixation testi; logout sonrası eski cookie çalışmaz.
- Doğrudan RSC, Route Handler ve Server Action çağrıları menü/layout atlanarak denenir; hepsinde aynı server guard bulunur. CSRF/origin ve rate limit bypass edilemez.
- Aynı User A'da ADMIN, B'de TEACHER: B'de A'nın admin yetkileri yok. ADMIN+TEACHER birleşiminde özel not sadece yazar ve aktif atama kapsamında.
- Invitation iki eşzamanlı kabulde yalnız bir kez tüketilir; expiry/revoke/resend/yanlış email ve cross-tenant branch/kayıt bağlama reddedilir.
- Öğrenci login'i olmayan StudentRecord korunur. Davet kabulünde kullanıcıya ait olmayan kayıt bağlanamaz. PARENT role tek başına child verisi vermez; kategori/audience kapalı fixture'lar deny üretir.
- MFA olmayan owner/admin hassas veriye ulaşamaz; taze step-up sonrası erişir; step-up session mutlak süresini uzatmaz. Export ve ownership transfer denetlenir.
- Üyelik iptali açık sekmede sonraki istekten itibaren deny; öğretmenin diğer okul erişimi sürer. Global User suspension tüm kurumları kapatır.
- Audit başarılı/başarısız güvenlik olaylarını PII/token/parola olmadan izler; business mutation ile tenant audit atomiktir. Giriş/çıkış/recovery olayları PlatformAuditLog'a yazılır.
- Kimlik sağlayıcı kesintisinde fail-closed güvenli hata, yetkisiz cache fallback yok. Hesap enumeration, açık redirect ve callback state/nonce kontrolleri doğrulanır.

Kabul: mevcut beş kontrol + Playwright login/logout/org-switch/harness kapalı/MFA testleri başarılı, izole test DB ve provider test realm kullanılmış, Faz 02 şema yeniden tasarlanmamış, kaynak yetki kararları kayıt altına alınmış. Akademik ekran ve CRUD bu fazın tamamlanma şartı değildir.

## Ortam değişkenleri ve açık işler

APP_ORIGIN, AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET ve AUTH_CALLBACK_URL seçilen sağlayıcıya göre adlandırılır; Session token'ı üretmek için plaintext secret loglanmaz. Sağlayıcı saklama/aktarım şartları ve e-posta teslimi Faz 03 başlangıcında kimlik mühendisi + privacy sorumlusu tarafından kapatılır. Parola reset ve MFA lifecycle sağlayıcı seçimiyle kesinleştirilmeden production auth açılmaz.
