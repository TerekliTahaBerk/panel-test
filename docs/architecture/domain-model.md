# Alan modeli ve kesin kararlar

Bu belge [veritabanı sözleşmesi](database-design.md), [izin matrisi](permission-matrix.md) ve [ERD](diagrams.md) ile birlikte okunur. Kurum (organization) veri izolasyon sınırıdır; şube (branch) kurum içindeki isteğe bağlı erişim sınırıdır.

1. **StudentRecord, User'dan bağımsızdır.** Hesapsız öğrenci içe aktarılabilir. Aynı gerçek kişinin iki kurumda iki akademik kaydı bulunur; otomatik birleştirme/paylaşma yapılmaz. Kayıt, isteğe bağlı aynı kurum üyeliğine bağlanır.
2. **TeacherRecord kurum kapsamındadır.** İki okulda çalışan öğretmenin tek User'ı, iki Membership'i ve iki TeacherRecord'u vardır. Davet öncesi personel kaydı üyelik olmadan açılabilir.
3. **Bir üyelik birden fazla rol taşır.** ADMIN + TEACHER mümkündür; kodla tanımlanan roller RoleAssignment satırlarıdır. OWNER ayrı rol değildir; Organization.ownerMembershipId tek sahiplik kaynağıdır. Sahip için yönetim yetkileri hesaplanır, öğretmen özel notlarına otomatik erişim verilmez.
4. **Şube yeni tenant değildir.** Membership.accessScope = ORGANIZATION veya BRANCHES. İkinci durumda BranchMembership izin verilen şubeleri belirler. Şubesiz veri yalnız kurum kapsamındaki personele açıktır; öğrenci/veli kendi kayıt ilişkisiyle okuyabilir. Şube üyeliği tek başına yetki vermez. MVP tek şubesiz kurumla çalışır; şube yönetim ekranları ileriki kapsamdadır.
5. **Öğretmen ayrılması** Membership'in REVOKED, TeacherRecord'un INACTIVE yapılmasıdır. Atamalar bitirilir, gelecek dersler yeniden atanır. Geçmiş ders ve yazarlık korunur; diğer okul üyeliği etkilenmez. Sonraki istekten itibaren erişim reddedilir.
6. **Veli bağlantısı** kurum kapsamlı GuardianRecord ile StudentRecord arasında ParentStudentRelationship'tir. İlişki doğrulama/onay sonrasında etkinleşir; isim, e-posta, telefon veya ortak User eşleşmesi ilişki kurmaz. Kategoriler açıkça ayrı izinlerdir.
7. **Bir öğrenci birden fazla gruba katılabilir.** Enrollment dönemli ilişkiyi tutar; aynı öğrenci/grup için yalnız bir açık dönem vardır. Geçmiş kayıt yeniden açılmayıp yeni dönem oluşturulur.
8. **Grup kapasitesi** pozitif tamsayı veya null (sınırsız) olur. Dört kişilik sabit varsayım kaldırılır. Null kotayı devre dışı bırakmaz; SaaS öğrenci limiti ayrıca uygulanır. Son koltuk için kilitli transaction gerekir.
9. **Abonelik kuruma aittir.** Tek güncel Subscription satırı ve append-only SubscriptionEvent geçmişi yeterlidir; veliye öğrenci ücreti/fatura takibi bu modelin konusu değildir.
10. **Kurumlar arası referanslar** her tenant hedefte `(organizationId,id)` unique ve her tenant ilişkide bileşik FK ile engellenir. Sadece uygulama filtresi yeterli değildir.

## İş kuralları

Organization türleri INDIVIDUAL, CENTER, SCHOOL; zorunlu okul/şube yoktur. ACTIVE → SUSPENDED → ACTIVE veya ARCHIVED geçişleri denetlenir. Arşiv normal çalışma alanını kapatır; doğrulanmış veri talebi ayrı iş akışıdır. Sahiplik devri aktif ve kurum kapsamına sahip üyeye, güncel MFA ve aynı transaction içindeki satır kilidiyle yapılır. Sahip üyelik iptal edilmeden önce devir zorunludur.

Dersler tek Group'a bağlıdır; bireysel ders kapasitesi 1 olan grupla temsil edilir (yapay okul veya şube oluşturulmaz). Group varsayılan öğretmen, Lesson fiili öğretmen tutar; vekil öğretmen mümkündür. Öğretmen erişimi ilgili aktif grup/ders ataması veya StudentTeacherAssignment ile sınırlanır. Önceki atama erişim vermeyi sürdürmez.

Yoklama otomatik PRESENT yaratmaz; satır yoksa henüz alınmadı anlamındadır. Geçmiş derse yoklama, öğrencinin o ders tarihindeki Enrollment aralığını gerektirir. Assignment yayımlanırken AssignmentProgress alıcı listesi dondurulur; sonradan gruba giren öğrenci kendiliğinden geçmiş ödevlerin alıcısı olmaz. Teslim denemeleri değişmez kanıt olarak korunur, inceleme sürümlüdür. Özel not ile yayımlanan geri bildirim ayrı modellerdir.

Exam kurumun sınav tanımı, ExamResult öğrenci katılımı, ExamSectionResult bölüm sonucudur. Öğrencinin dışarıda girdiği deneme için de kurum içi Exam tanımı oluşturulur; başka kurumun sınavına doğrudan bağlanmaz. Net hesaplama kuralı ve sürümü sınavda saklanır. StudentProgressSnapshot MVP'de yoktur: önce kapsamlı kaynaklardan sorgu; ölçülmüş performans ihtiyacında yeniden üretilebilir projection eklenir.

## Varsayımlar ve açık kararlar

MVP tek veritabanı bölgesi ve kurum başına bir sahip destekler. Özel rol tasarımcısı, şubeler arası farklı ders yetkileri, canlı sınav yürütücüsü ve ileri koçluk planlayıcısı ertelenir. Açık konuların sahibi ve son tarihi [Faz 01 raporundadır](../phases/phase-01.md).
