# Migration işletimi

Kanonik zincir:

1. `202610300001_core`: yedi model, enum, unique/index ve bileşik FK.
2. `202610300002_security`: CHECK, değişmezlik, deferred owner, RLS ve runtime grant'ları.
3. `202610300003_provisioning`: dar definer fonksiyonu, caller/function-owner grant ve politikaları.

İlkinde `scripts/database/roles.sql` bootstrap yöneticisi tarafından çalıştırılır; bu dosya
credential içermez. Migrator'a hedef DB CONNECT/CREATE, public USAGE/CREATE verilir.
PUBLIC DB CONNECT/CREATE/TEMP ve public schema CREATE kaldırılır. Runtime/caller'a yalnız
CONNECT verilir; LOGIN parolaları ayrı güvenli kanalda sağlanır. İzole test hazırlayıcısı
bu işlemleri otomatik yapar. Üretim sağlayıcısı bu fazda seçilmemiştir; bu belge production
bootstrap/deploy yetkisi değildir.

```bash
# Yalnız izinli geliştirme/izole hedef; DIRECT_URL panel_migrator olmalıdır.
npm run db:migrate
npm run db:generate
```

`prisma db push` ve otomatik reset kullanılmaz. Yeni migration boş DB'de ve ikinci deploy'un
no-op olduğu kanıtlanarak test edilir. Catalog testleri actual FK/CHECK/PK/index/deferred
trigger, forced RLS, sahip ve grant'ları denetler. Prisma DSL dışındaki SQL'ler bilinçli
uzantılardır; Prisma migrate diff trigger/RLS'yi tam ifade etmez.

Başarısız migration sonrası otomatik düşürme/reset yoktur; geliştirmede yeni boş test DB
ile düzeltilmiş zincir doğrulanır. Yayınlanmış migration sonradan değiştirilmez; ileri düzeltme
migration'ı hazırlanır. Operatör failed migration kaydını ve transaction sınırını inceler;
üretim verisinde deney yapılmaz. Şema değişimi expand → backfill → validate → contract
sırasını korur; yedek/PITR/restore üretim önkoşulu sonraki fazdadır.
