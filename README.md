# Eğitim Platformu

Bireysel öğretmenler, özel ders verenler, koçlar, eğitim merkezleri ve okullar için bağımsız,
abonelik temelli eğitim yönetim SaaS'ı. Tenant sınırı kurumdur; kullanıcı farklı kurumlarda
farklı üyelik/roller taşıyabilir. Gerçek kimlik doğrulama Faz 03'te gelir.

Online Dershanem deposu, veritabanı ve servisleri bu projeye bağlı değildir ve değiştirilmez.

## Faz durumu

| Faz   | Kapsam                                                                             | Durum                                                                             |
| ----- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 00    | Temel uygulama ve tasarım entegrasyonu                                             | Tamamlandı — PR #1/#2 merged                                                      |
| 01    | Mimari ve alan modelleme                                                           | Tamamlandı — [PR #3](https://github.com/TerekliTahaBerk/panel-test/pull/3) merged |
| 02    | Çok kiracılı altyapı                                                               | Devam ediyor — [uygulama ve kabul kanıtları](docs/phases/phase-02.md)             |
| 03–11 | Kimlik/yetki, ekranlar, onboarding, akademik alanlar, billing, operasyon ve üretim | Başlamadı                                                                         |

Tam yol haritası: [docs/phases/README.md](docs/phases/README.md).

## Teknoloji ve başlatma

Next.js 16.4.3 / React 19.3.1 / TypeScript 5.9.3; Tailwind 4, Geist, Radix ve mevcut
tasarım sistemi korunur. PostgreSQL 17.10 / Prisma 7.10.1 / pg 8.23.1:
[sürüm kararı](docs/decisions/ADR-0009.md). Node 22.12+ gerekir.

```bash
npm ci
npm run dev
```

Demo: [localhost preview](http://localhost:3000/preview/admin). Production'da preview
ENABLE_PREVIEW_ROUTES=true değilse 404 döner. Bu ayar kimlik veya tenant erişimi vermez.
`/app/[orgSlug]` gerçek adapter gelene kadar 401/no-store döndürür; login/onboarding yoktur.
`.env.example` yalnız placeholder içerir; DB bağlantısı olmadan build/preview çalışır.

## Komutlar

| Komut                                     | Açıklama                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                             | Geliştirme sunucusu                                                      |
| `npm run build` / `npm start`             | Üretim derlemesi / sunucu                                                |
| `npm run lint` / `npm run typecheck`      | Kod ve tip denetimi                                                      |
| `npm run format` / `npm run format:check` | Biçimlendirme / kontrol                                                  |
| `npm test`                                | Unit/component testleri                                                  |
| `npm run test:e2e`                        | Production build üzerinde preview ve workspace sınırı testleri           |
| `npm run db:up` / `db:ready` / `db:down`  | İzole Docker PostgreSQL başlat / kontrol / durdur                        |
| `npm run db:local:prepare`                | Sabit panel_local_dev geliştirme DB'si + roller + migration              |
| `npm run db:test:prepare`                 | Yeni, doğrulanmış test DB'si + roller + migration; mevcut DB resetlenmez |
| `npm run db:generate` / `db:migrate`      | Prisma Client üret / DIRECT_URL üzerinden migrate deploy                 |
| `npm run test:integration`                | Gerçek PostgreSQL izolasyon/rol/provisioning testleri                    |
| `npm run validate`                        | Lint + tip + unit + build                                                |

DB komutları için önce [yerel kurulum](docs/operations/local-database.md) izlenmelidir.
Test URL'si runtime URL'sinden ayrıdır; sentetik fixture dışında veri kullanılmaz.

## Kaynak ve belgeler

- `src/features`, `src/components`, `src/styles`: mevcut sunum ve tasarım sistemi.
- `prisma/schema.prisma`, `prisma/migrations`: yedi çekirdek model ve kanonik SQL.
- `src/server/db`, `src/server/tenant`, `src/server/modules`: server-only DAL ve sözleşmeler.
- `tests/unit`, `tests/integration`, `tests/e2e`: uygulama ve gerçek DB güvenlik testleri.
- [Mimari](docs/architecture/overview.md), [tenant bağlamı](docs/architecture/tenant-context.md),
  [RLS](docs/architecture/rls-implementation.md), [provisioning](docs/architecture/provisioning-implementation.md),
  [test matrisi](docs/security/tenant-isolation-test-matrix.md), [migration işletimi](docs/operations/migrations.md).

Akademik modeller, gerçek auth/MFA, canlı kurum kurulumu, ödeme ve production deployment
bu fazın kapsamı dışındadır. CI, production credential kullanmadan ayrı PostgreSQL service
container üzerinde gerçek güvenlik testlerini çalıştırır; mock'a geri düşmez.
