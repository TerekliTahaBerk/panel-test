# Yerel PostgreSQL

Node 22.12+ ve Docker Compose gerekir. Production/legacy bağlantısı kullanılmaz.
`.env.example` yalnız placeholder içerir. Gerçek parola/URL commit edilmez.

```bash
npm ci
export PANEL_LOCAL_DB_PASSWORD='yalniz-yerel-sentetik-parolaniz'
npm run db:up
npm run db:ready
export TEST_DATABASE_URL="postgresql://panel_bootstrap:${PANEL_LOCAL_DB_PASSWORD}@127.0.0.1:55432/panel_local_001_test"
npm run db:test:prepare
npm run db:generate
npm run test:integration
npm run db:down
```

URL içinde özel karakterli parola percent-encode edilmelidir. Test hazırlayıcı yalnız
loopback host ve `panel_[a-z0-9_]+_test` isim kabul eder; bootstrap kullanıcısı
panel_bootstrap veya postgres olmalıdır. NODE_ENV=production kesin reddedilir. DATABASE_URL
hiçbir zaman test/reset hedefi sayılmaz. Mevcut DB silinmez/resetlenmez: ikinci hazırlama
başarısız olur; yeni sentetik koşu için `panel_local_002_test` gibi yeni isim seçin.

Compose yalnız 127.0.0.1:55432 yayınlar; test ve dev verisi named volume'da kalır.
`db:down` volume silmez. Bootstrap; DB/roller/grant kurar, migrate deploy'u iki kez çalıştırır,
sonra yalnız test DB'sinde kotayı açar. Aynı cluster'da paralel hazırlama yerine her CI işi
ayrı PostgreSQL service container kullanır. Roller cluster genelidir; test rol parolaları
bootstrap URL'sindeki sentetik parola ile ayarlanır. Bu araç shared/production cluster'a yönelik değildir.

Next uygulamasının DB'ye bağlanması gerektiğinde DATABASE_URL panel_runtime kullanır;
DIRECT_URL ayrı panel_migrator'dır. CLI env'i shell veya Node `--env-file` üzerinden alır;
Prisma config sessizce `.env.local` yüklemez. Next `.env.local` dosyasını kendi yükler.

2026-10-30 yerel doğrulama Docker daemon kapalı olduğu için Homebrew PostgreSQL 17.10'un
ayrı `/private/tmp/panel-phase02-pg` cluster'ında yapıldı; aynı migration ve test komutları
kullanıldı. Compose container başlangıcı yerelde çalıştırılmış sayılmaz; CI service bunu doğrular.
