# Veri yaşam döngüsü ve mahremiyet

## Erişim ve sahiplik sınırları

Bir kurumda oluşan akademik kayıt başka kurumla paylaşılmaz. User'ın global olması akademik veriyi global yapmaz. Kurum kayıtların eğitim amacıyla kullanılmasını yönetir; platform hizmeti teknik olarak işletir. KVKK bakımından veri sorumlusu/veri işleyen rolleri tarafların gerçek süreç ve sözleşmelerine göre hukuk danışmanı tarafından doğrulanmalıdır; bu tasarım bir uygunluk sertifikası değildir.

Birden çok veli ve çocuk desteklenir. GuardianRecord → ParentStudentRelationship → StudentRecord zinciri kurum içidir. Vasi ilişkisi doğrulanmadan ACTIVE olmaz. Her veri kategorisi ayrı ve varsayılan kapalıdır; guardian üyeliği, ilişki aktifliği, kategori ve yayımlama durumu birlikte gerekir. Özel LessonNote hiçbir veli/öğrenci DTO'suna, arama sonucuna, analitiğe, bildirime veya export'a konmaz. PublishedFeedback açıkça yazılmış ve yayımlanmış ayrı gövdedir; özel notun otomatik kopyası değildir.

Öğretmen kendi aktif atamalarındaki öğrencilerin eğitim alanlarını görebilir; kurumun tüm öğrencilerini göremez. Doğum tarihi, iletişim, olası sağlık/uyarlama bilgisi ayrı allowlist ve amaç gerektirir. MVP'de TCKN ve sağlık alanları toplanmaz. Tam DB `include` çıktısı istemciye gönderilmez. Hassas öğretmen/personel notları ayrı süreç tasarlanmadan TeacherRecord'a eklenmez.

## Yaşam döngüsü

| Veri                      | Olağan sonlandırma               | Silme/retention tasarımı                                                                                   | Yetkili süreç                                   |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Akademik öğrenci kaydı    | ARCHIVED, aktif enrollment biter | Fiziksel silme hukuki dayanak/süre incelemesinden sonra ilişkili purge                                     | Kurum yetkilisi + doğrulanmış talep             |
| Öğretmen/veli üyeliği     | REVOKED/INACTIVE                 | Yazarlık ve doğrulama geçmişi saklanır, erişim anında kesilir                                              | Kurum yöneticisi                                |
| Global hesap              | DELETION_PENDING → ANONYMIZED    | UserIdentity ve Session iptali; üyelik bağlantıları kontrollü kaldırılır, eğitim kayıtları cascade edilmez | Kimlik ekibi + kurumlara yönlendirilen talepler |
| Özel not / teslim / sınav | Arşiv/geri çekme                 | Amaç bazlı saklama takvimi ve hukuki muhafaza kontrolü                                                     | İlgili kurum ve privacy sorumlusu               |
| Audit                     | Append-only                      | Önerilen 1 yıl; hukuk onayı ve minimizasyon olmadan sabit yasal süre sayılmaz                              | Ayrı retention rolü                             |
| Davet / kurtarma token    | Süre sonu / kullanım             | Kurtarma süresi sonrası en çok 30 gün metadata; davet 90 gün operasyon önerisi                             | Kimlik bakım işi                                |
| Export dosyası            | Oluşturuldu / indirildi / iptal  | En çok 24 saat önerisi; özel depoda TTL                                                                    | İstek sahibi yeniden yetkilendirilir            |
| Backup                    | Şifreli ve erişimi kısıtlı       | Önerilen 30 gün döngü; silme tombstone kayıtları restore sonrası yeniden uygulanır                         | Platform operasyon                              |

Bunlar ürün tasarım varsayımlarıdır, mevzuatın zorunlu süreleri olarak sunulmaz. Akademik saklama süresi ürün/hukuk tarafından tanımlanmadan gerçek veri kabulü ve otomatik purge açılamaz. Kurum arşivi hesap silme değildir; platform hesabı silme bir okulun bütün kayıtlarını silmez. Öğretmen ayrılışı başka okulun rolünü veya kaydını değiştirmez.

## Veri talebi iş akışı

Talep al → kimlik/temsil yetkisini doğrula → ilgili kurum ve veri kategorilerini belirle → hukuki muhafaza/sözleşme değerlendirmesi → kapsam önizlemesi → onaylı export/düzeltme/erasure → audit ve teslim kaydı. Başka öğrencilerin verisi, diğer velilerin iletişimi ve özel öğretmen notları otomatik export'a girmez. Veli temsil yetkisi yaş, velayet veya itiraz halinde manuel incelemeye gider. Yetki kaybı üretim ve indirme aşamasında işi iptal eder.

Erasure işleminde DB ve private nesneler için manifest oluşturulur. Nesne silme retry edilebilir ve idempotent olur; işlem tamamlanmadan kullanıcıya tamamlandı denmez. Backup anlık tekil silmeyi desteklemiyorsa rotasyon ve restore sonrası tekrar silme kontrolü kayıt altına alınır.

## Hukuki doğrulama listesi

Sahip: ürün sahibi + KVKK danışmanı; son tarih gerçek veri kabulünden ve sağlayıcı sözleşmesinden önce. Sorular: kurum/platform veri sorumluluğu, işleme amacı ve dayanağı, çocukların bilgilendirilmesi ve temsil yetkisi, yurt dışı aktarım/alt işleyen ve veri bölgesi, saklama/silme yükümlülükleri, ticari ileti ile hizmet bildirimi ayrımı, veri ihlali ve ilgili kişi talepleri süreçleri. Onay metni tek başına tüm işlemler için dayanak sayılmaz. Kararlar kayıt altına alınır; teknik ekip hukuki uygunluk kararı vermez.
