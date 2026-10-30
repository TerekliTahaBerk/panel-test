# Veri taşıma ve içe aktarma stratejisi

## A — Kod ve iş kuralı yeniden kullanımı

Yalnız kaynak inceleme ve reuse-matrix'teki bağımsızlaştırılabilir kurallar. Şema, migration geçmişi, credential, `.env`, customer export veya üretim DB dump'ı kopyalanmaz. Yeni ürünün migration zinciri boş veritabanında başlar. Eski üretimle senkronizasyon veya kalıcı bağlantı bulunmaz.

## B — İleride açıkça talep edilen veri aktarımı

Varsayılan kapalıdır. Veri sorumlusu talimatı, aktarılacak kurum ve kapsam, sözleşme/işleme dayanağı, veli/çocuk temsil yetkisi ve gerekiyorsa rıza değerlendirmesi hukuk/kurum yetkilisince tamamlanmadan gerçek veri import'u yapılamaz. Mevcut müşteriler otomatik taşınmaz. Bu faz hiçbir gerçek veri toplamaz; aşağıdaki süreç uygulama tasarımıdır.

1. Kurumun yetkili kanaldan sağladığı, kapsamı onaylı export'u geçici şifreli alana al; üretime bağlanma. Kaynak sürümü, checksum, kolon sözlüğü ve talimat referansı manifestte yer alsın.
2. Hedef Organization ve sourceNamespace onaylanır. Her batch tek kuruma aittir; dosyadan gelen organizationId kullanılmaz. Legacy id → yeni UUID map'i `(org,sourceNamespace,entityType,legacyId)` unique olur. ImportBatch/ImportMapping tabloları yalnız import fazında ADR ile eklenir.
3. Schema sürümü, alan tipleri, tarih/timezone, kişi sayısı ve dosya boyutu sınırlarını doğrula. Parent/grup/ödev referansları çözülemiyorsa satır karantinaya alınır, sessiz atlama yapılmaz. Legacy cascade veya global rol varsayımları yeni sisteme taşınmaz.
4. Kimlik adaylarını normalize e-posta ile raporla; otomatik User merge yapma. Mevcut global hesap varlığını kurum yöneticisine ifşa etme. Öğrenci/öğretmen/veli kurum kayıtları önce nullable membership ile açılır. Doğrulanmış davet kabulünden sonra kimlik bağlanır; parola/token taşınmaz.
5. Dry-run hiçbir hedef veriyi yazmadan proposed create/update/conflict/reject sayıları ve referans raporu üretir; çıktı PII'yi maskeler. Manuel eşleme kararı batch manifestini yeni sürüme taşır.
6. İncelenmiş batch onayından sonra bağımlılık sırası: kurum/şube/subject → kişi kayıtları → grup/atama/enrollment → seri/ders → yoklama/ödev/alıcı → teslim/materyal → sınav/sonuç → doğrulanmış veli bağı. Owner ve admin gibi ayrıcalıklar import dosyasından otomatik yaratılmaz.
7. Küçük ilişki-tutarlı transaction batch'leri kullan. Mapping, veri, checksum ve audit aynı transaction'da yazılır. Aynı namespace/legacyId ve aynı digest yeniden çalışmada NO_OP; farklı digest CONFLICT olur. Güncelleme gerekiyorsa yeni onaylı version ve expectedVersion gerekir.
8. Hata raporu satır numarası, güvenli kaynak id, hata kodu ve düzeltme önerisi içerir; secret/özel not dökmez. Batch durumu VALIDATING, READY, APPLYING, PARTIAL_FAILED, COMPLETED, ROLLED_BACK; failed satırlar yeniden doğrulanmadan retry edilmez.
9. Sonuçta toplam, FK, active enrollment ve kategori/yayın durumları uzlaştırılır. Yetkisiz cross-tenant satır DB FK/RLS ile başarısız olmalıdır. İçe aktarma açık erişim veya davet gönderimi yaratmaz; davet ayrı onaylı işlemdir.

## Rollback ve taşınabilirlik

Batch oluşturduğu id ve önceki sürümleri kaydeder. İşlem içindeki hata rollback'tir; commit edilmiş batch'in geri alınması yalnız henüz sonradan değiştirilmemiş kayıtlar için ters bağımlılık sırasıyla yapılır. Sonradan yazılmış akademik veri varsa otomatik delete yapılmaz; kurum yetkilisinin düzeltme planına gider. Üretim DB'sinin tamamını restore etmek tenant rollback yöntemi değildir. Dosya nesneleri manifest üzerinden ayrı retry'lı temizlenir.

Portability export'u sürümlü JSON/CSV + dosya manifesti + kurum içi referans haritasıdır. Kimlik secret'ı, diğer kurum verisi ve izin verilmeyen özel not içermez. Yayımlama durumu ve kategori izinleri korunur; export indirmesinde yetki yeniden doğrulanır.

## Sentetik dry-run kabul senaryoları

İki kurum A/B; iki okulda çalışan tek öğretmen; hesapsız öğrenci; farklı okullarda iki çocuğu olan veli; iki veli/tek çocuk; tekrar legacy id; bozuk FK; yanlış kurumlu group; süresi geçmiş davet; aynı dosya iki kez; aynı id farklı içerik; kesilen batch; sonradan değiştirilmiş satıra rollback. Dry-run sıfır iş verisi yazmalı; apply sonrası ikinci çalıştırma sıfır duplicate üretmeli. Test verileri tamamen uydurmadır; eski repo fixture'ları kişisel veri içerebileceği için otomatik kopyalanmaz.
