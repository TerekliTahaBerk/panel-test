# Kimlik ve yetkilendirme

## Kavramlar

User global hesap; UserIdentity doğrulanmış sağlayıcı subject'i; Session kimlik doğrulama kanıtıdır. Membership User × Organization erişimidir, role sahip olmak için ACTIVE olmalıdır. RoleAssignment kurumda ADMIN, TEACHER, STUDENT, PARENT rollerinden birini verir; birden fazlası mümkündür. Organization.ownerMembershipId hesaplanan sahip yetkisini verir. PlatformRoleAssignment yalnız SUPER_ADMIN taşır ve workspace rolü değildir.

StudentRecord ve TeacherRecord kurum kayıtlarıdır; membershipId nullable bileşik FK'dır. GuardianRecord davet öncesi veliyi temsil eder; membershipId nullable'dır. Bağlama, doğrulanmış davet kabulü ve kurum yetkilisinin kayıt eşlemesiyle yapılır; isim benzerliği veya e-posta başına otomatik birleştirme yoktur. Üyelikte STUDENT rolü kendi başına kayıt okutmaz; bağlı StudentRecord gerekir. Aynı kural öğretmen ve veli için geçerlidir.

Membership.accessScope ORGANIZATION veya BRANCHES'dir. Roller pozitif izinleri birleştirir, ancak her grant kendi kaynak kapsamını taşır. Önce kurum/hesap/üyelik aktifliği, sonra şube, kaynak ilişkisi ve alan gizliliği kontrol edilir. Bir rolden gelen geniş okuma başka rolün özel not kapsamını genişletmez. Rol değiştirme arayüzü sadece sunumdur; `WorkspaceContext.role` güvenlik girdisi değildir.

## İstek akışı

1. Sunucu Session token'ını doğrular: hash, sona erme, revokedAt, User.status, authVersion, gerekli MFA.
2. URL'deki orgSlug aday Organization'a çözülür; oturum User'ına ait aktif Membership ve kurum durumu doğrulanır. İstek body/header'ındaki rol dikkate alınmaz.
3. Sunucu TenantContext üretir: organizationId, actorUserId, membershipId, roles, branchScope, assurance, policyVersion, requestId. Browser'a bu nesnenin yetki belirleyen biçimi gönderilmez.
4. Alan servisi `authorize(ctx, action, resourceScope)` çalıştırır. Repository hem tenant hem kaynak koşuluyla sorgular. Yazmada beklenen sürüm ve kapsam transaction içinde yeniden kontrol edilir.
5. DTO allowlist'i yalnız ilgili izleyici alanlarını seçer. DB satırı doğrudan client'a serialize edilmez. Değişiklik + audit aynı transaction'da commit olur.

RSC her veri loader'ında kontrol eder; layout kontrolü tek başına yetmez. Route Handler API'de oturumsuz 401, kaynak yok/yetkisiz 404, mevcut kurumda bilinen yasak işlem 403, sürüm/kapasite yarışı 409, rate limit 429, bağımlılık hatası 503 kullanır. Server Action dışarıdan çağrılabilir uç olarak aynı guard, input validation ve origin/CSRF politikasından geçer. Middleware ve sidebar güvenlik mekanizması değildir.

Dosya erişimi ve background işler [tenant sözleşmesini](multi-tenancy.md) uygular. Yetki cache'i istek ömrünü aşmaz; rol/üyelik/veli ilişkisi iptali sonraki istekte geçerlidir. Uzun export/job adımları yeniden doğrular. Global oturum iptali diğer kurumlardaki oturumu da etkiler; yalnız üyelik iptali diğer kurum erişimini kesmez.

## Davet ve sahiplik

Invitation kurum kapsamlı; hedef e-posta, roles[], accessScope, isteğe bağlı OrganizationInvitationBranch satırları ve hedef kayıt bağlama talebini tutar. Şube bağlantıları bileşik FK ile, kayıt bağlama talepleri ilgili alan servisinde kabul sırasında aynı tenant içinde doğrulanır; JSON id listesi FK yerine geçmez. Davet token'ı rastgele ve tek kullanımlık, yalnız hash saklanır; 72 saat tasarım varsayımıdır. Kabul, doğrulanmış e-posta ve aynı transaction'da PENDING→ACCEPTED koşullu güncelleme ister. Tekrar gönderme önceki token'ı iptal eder. Admin OWNER atayamaz; devir yalnız mevcut sahibin güncel MFA'sıyla yapılır. Admin kendi rolünü yükseltemez.

Sahip veya ADMIN rolü + TEACHER birlikte olabilir; menü için seçilen teacher modu yönetici kimliğini değiştirmez. Eski admin preview/impersonation kodu taşınmaz. Platform destek erişimi Faz 10'a kadar kapalıdır.

[İzin matrisi](permission-matrix.md) eylem sözleşmesidir. Faz 03 sağlayıcı ve oturum ayrıntıları [handoff'tadır](../phases/phase-03-handoff.md).
