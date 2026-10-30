# Eski sistem envanteri

İncelenen yerel legacy HEAD: `666d37d7c0d78d816af1517f4f6db8029f633632`; izlenen dosyalarda değişiklik yoktu. Yalnız kaynak dosyalar okundu; test/script çalıştırılmadı, DB veya üretim hizmetine bağlanılmadı. Kaynak linkleri bu commit’e sabitlenmiştir.

## Sistem ve gerçek sahiplik

Next.js App Router panel girişleri `app/panel/layout.tsx` → `lib/auth/guards.ts`; API guard ve mutasyon doğrulaması route/handler seviyesindedir. Prisma PostgreSQL tek veri modelini `prisma/schema/base.prisma` üzerinden yükler. Auth/education/odk/kocum/commerce/business/system dosyaları alan gruplamasıdır; tenant izolasyonu değildir. `docs/data-model-ownership.md` sahiplik haritası bazı model sayıları bakımından tarihsel kalmıştır; aşağıdaki envanter doğrudan şema tanımlarından çıkarılmıştır.

Hedef repo kanıtları: `package.json` Prisma/auth bağımlılığı içermiyor; `src/app/preview/layout.tsx` demo gate; `src/features/workspace/types.ts` shell DTO; `src/types/roles.ts` sunum rolü; `src/config/navigation.ts` görünürlük; `.github/workflows/quality.yml` lint/format/type/unit/build + e2e. Workspace tip yorumundaki “Phase 01 server resolution” yol haritasıyla çelişiyor; gerçek uygulama Faz 02/03’tedir ve bu fazda kod değiştirilmedi.

## Model ayrıntıları

Her model aşağıda kaynak konumu, mevcut ilişki/alan amacı, şemadan gerçek unique/index, servis/API sahipliği ve hedef yeniden tasarımıyla verilmiştir. FK alanları kaynak şemada görülebilir; tenant bileşik FK yokluğu ortak risktir.

### User

- Amaç / ilişkiler: Kimlik, parola, global role, davet alanları; hemen hesap zorunlu.
- Şema: [prisma/schema/auth.prisma:30](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/auth.prisma#L30).
- Mevcut kısıt ve indeksler: `email String @unique`; `inviteTokenHash      String?   @unique @map("invite_token_hash")`; `@@index([role, status])`; `@@index([createdById])`; `@@index([archivedById])`; `@@index([fullName])`; `@@index([phone])`
- İş kuralı ve sahiplik: [lib/auth/guards.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/guards.ts); şema alanı `auth`.
- Yeniden kullanım: **REWRITE** → `User + UserIdentity + Membership + Invitation`.
- Tenant riski / değişiklik: Global rol ve kullanıcı üzerinde davet iki okulda farklı yetki/davet veremez.

### Session

- Amaç / ilişkiler: User ilişkisi, hash token ve MFA zamanları.
- Şema: [prisma/schema/auth.prisma:190](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/auth.prisma#L190).
- Mevcut kısıt ve indeksler: `tokenHash String @unique @map("token_hash")`; `@@index([userId])`; `@@index([expiresAt])`
- İş kuralı ve sahiplik: [lib/auth/session.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/session.ts); şema alanı `auth`.
- Yeniden kullanım: **REFACTOR** → `Session`.
- Tenant riski / değişiklik: activeProduct yalnız sunumdur; tenant veya membership doğrulamaz. Hash ve iptal ilkesi korunur.

### StudentProfile

- Amaç / ilişkiler: User ile zorunlu 1:1; doğum tarihi, hedefler, eğitim geçmişi.
- Şema: [prisma/schema/education.prisma:53](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L53).
- Mevcut kısıt ve indeksler: `userId     String    @unique @map("user_id")`
- İş kuralı ve sahiplik: [lib/panel/education-management-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-management-server.ts); şema alanı `education`.
- Yeniden kullanım: **REWRITE** → `StudentRecord`.
- Tenant riski / değişiklik: userId unique ve cascade akademik kaydı hesaba bağlar; kurum bazlı bağımsız kayıt ve nullable üyelik gerekir.

### TeacherProfile

- Amaç / ilişkiler: User ile zorunlu 1:1; branş, koçluk, kapasite, internalNotes.
- Şema: [prisma/schema/education.prisma:159](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L159).
- Mevcut kısıt ve indeksler: `userId        String   @unique @map("user_id")`; `@@index([isCoach])`
- İş kuralı ve sahiplik: [lib/panel/education-management-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-management-server.ts); şema alanı `education`.
- Yeniden kullanım: **REWRITE** → `TeacherRecord`.
- Tenant riski / değişiklik: Bir öğretmen iki kurumda ayrı personel kaydı taşımalı; gizli not ve kapasite global tutulmamalı.

### ParentStudent

- Amaç / ilişkiler: User veli ile StudentProfile, akademik/ödeme izinleri.
- Şema: [prisma/schema/education.prisma:206](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L206).
- Mevcut kısıt ve indeksler: `@@unique([parentId, studentId])`; `@@index([studentId, active])`; `@@index([parentId, active])`
- İş kuralı ve sahiplik: [lib/panel/parent-scope.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parent-scope.ts); şema alanı `education`.
- Yeniden kullanım: **REWRITE** → `GuardianRecord + ParentStudentRelationship`.
- Tenant riski / değişiklik: canViewAcademic=true varsayılanı kaldırılır; kurum ve kategori izinleri, doğrulanmış temsil gerekir.

### ParentStudentHistory

- Amaç / ilişkiler: Veli bağlantısının actor ve önceki değer geçmişi.
- Şema: [prisma/schema/education.prisma:228](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L228).
- Mevcut kısıt ve indeksler: `@@index([parentId, createdAt])`; `@@index([studentId, createdAt])`; `@@index([actorUserId, createdAt])`
- İş kuralı ve sahiplik: [lib/panel/parents-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parents-server.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `AuditLog`.
- Tenant riski / değişiklik: Ayrı history kopyası yerine kurum kapsamlı redakte denetim; silmede cascade geçmiş kaybı değerlendirilir.

### Group

- Amaç / ilişkiler: Tek User öğretmen, serbest ders adı, capacity=4.
- Şema: [prisma/schema/education.prisma:249](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L249).
- Mevcut kısıt ve indeksler: `@@index([teacherId, isActive])`; `@@index([name])`
- İş kuralı ve sahiplik: [lib/panel/group-management-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/group-management-service.ts); şema alanı `education`.
- Yeniden kullanım: **REWRITE** → `Group + Subject`.
- Tenant riski / değişiklik: Sabit kapasite serviste de vardır; kurum personeline FK ve opsiyonel şube gerekir.

### LessonSeries

- Amaç / ilişkiler: Grup + User öğretmen, haftalık tekrar tanımı.
- Şema: [prisma/schema/education.prisma:274](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L274).
- Mevcut kısıt ve indeksler: `@@index([groupId, isActive])`; `@@index([teacherId, isActive])`
- İş kuralı ve sahiplik: [lib/panel/lesson-series-schedule.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/lesson-series-schedule.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `LessonSeries`.
- Tenant riski / değişiklik: Saf tekrar algoritması yararlı; sabit İstanbul UTC ofseti genelleştirilmez, grup/tenant FK eklenir.

### Enrollment

- Amaç / ilişkiler: Grup–öğrenci, başlangıç ve bitiş aralığı.
- Şema: [prisma/schema/education.prisma:301](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L301).
- Mevcut kısıt ve indeksler: `@@unique([groupId, studentId])`; `@@index([studentId, endedAt])`; `@@index([groupId, endedAt])`
- İş kuralı ve sahiplik: [lib/panel/group-management-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/group-management-service.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `Enrollment`.
- Tenant riski / değişiklik: Mevcut unique geçmiş dönemleri sınırlar; açık dönem partial unique ve şube tutarlılığı gerekir.

### Lesson

- Amaç / ilişkiler: Grup, seri, User öğretmen; closeVersion ve idempotent kapanış.
- Şema: [prisma/schema/education.prisma:316](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L316).
- Mevcut kısıt ve indeksler: `@@index([teacherId, startsAt])`; `@@index([groupId, startsAt])`; `@@index([seriesId, startsAt])`; `@@index([title])`; `@@index([status, startsAt])`; `@@index([groupId, status, startsAt])`
- İş kuralı ve sahiplik: [lib/panel/lesson-route-contract.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/lesson-route-contract.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `Lesson`.
- Tenant riski / değişiklik: Aynı kurum ve aynı grup seri FK; atanmış TeacherRecord ve iptal/arşiv gerekir.

### Attendance

- Amaç / ilişkiler: Lesson + StudentProfile ve durum; PRESENT varsayılan.
- Şema: [prisma/schema/education.prisma:405](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L405).
- Mevcut kısıt ve indeksler: `@@unique([lessonId, studentId])`; `@@index([studentId, createdAt])`
- İş kuralı ve sahiplik: [lib/panel/education-management-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-management-server.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `Attendance`.
- Tenant riski / değişiklik: Varsayılan geldi varsayımı kaldırılır; ders tarihindeki enrollment, kurum ve yazar denetimi gerekir.

### LessonNote

- Amaç / ilişkiler: Ders ve opsiyonel öğrenci notu, konu/hedef/ödev.
- Şema: [prisma/schema/education.prisma:387](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L387).
- Mevcut kısıt ve indeksler: `@@index([lessonId])`; `@@index([studentId, updatedAt])`
- İş kuralı ve sahiplik: [app/api/panel/lessons/[id]/notes/route.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/app/api/panel/lessons/[id]/notes/route.ts); şema alanı `education`.
- Yeniden kullanım: **REWRITE** → `LessonNote + PublishedFeedback`.
- Tenant riski / değişiklik: Açık yazar ve özel/yayımlanan veri ayrımı eksik; not kapsamı allowlist ile ayrılır.

### Assignment

- Amaç / ilişkiler: Grup, opsiyonel ders, User yazar; progress/material/submission.
- Şema: [prisma/schema/education.prisma:427](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L427).
- Mevcut kısıt ve indeksler: `@@index([groupId, dueAt])`; `@@index([createdById, isActive])`
- İş kuralı ve sahiplik: [lib/panel/education-management-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-management-server.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `Assignment`.
- Tenant riski / değişiklik: Tenant ve aynı grup FK; yayın durumu ve alıcı snapshot gerekir.

### AssignmentProgress

- Amaç / ilişkiler: Ödev–öğrenci TODO/IN_PROGRESS/DONE, version.
- Şema: [prisma/schema/education.prisma:455](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L455).
- Mevcut kısıt ve indeksler: `@@unique([assignmentId, studentId])`; `@@index([studentId, status, updatedAt])`
- İş kuralı ve sahiplik: [lib/panel/education-handlers/assignment-submissions-id-review.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-handlers/assignment-submissions-id-review.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `AssignmentProgress`.
- Tenant riski / değişiklik: Kurumlu alıcı kaydı; student ve assignment eşleşmesi teslim FK ile korunur.

### AssignmentSubmission

- Amaç / ilişkiler: Deneme numarası, kanıt, inceleyen, feedback, idempotency.
- Şema: [prisma/schema/education.prisma:499](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L499).
- Mevcut kısıt ve indeksler: `idempotencyKey String                     @unique @map("idempotency_key")`; `@@unique([assignmentId, studentId, attemptNumber])`; `@@index([assignmentId, status, submittedAt])`; `@@index([studentId, submittedAt])`
- İş kuralı ve sahiplik: [lib/panel/education-handlers/assignment-submissions-id-review.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/education-handlers/assignment-submissions-id-review.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `AssignmentSubmission`.
- Tenant riski / değişiklik: Optimistic locking kuralı korunur; global key tenant kapsamına alınır, nested ilişkiler doğrulanır.

### LearningMaterial

- Amaç / ilişkiler: Grup/ders/ödev; URL ve private blob metadata.
- Şema: [prisma/schema/education.prisma:539](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/education.prisma#L539).
- Mevcut kısıt ve indeksler: `@@index([groupId, isActive, createdAt])`
- İş kuralı ve sahiplik: [app/api/panel/materials/[id]/file/route.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/app/api/panel/materials/[id]/file/route.ts); şema alanı `education`.
- Yeniden kullanım: **REFACTOR** → `LearningMaterial`.
- Tenant riski / değişiklik: Private dosya proxy örüntüsü yararlı; admin boş scope ve blob provider bağımlılığı yeniden yazılır.

### MockExam

- Amaç / ilişkiler: Öğrencinin bireysel deneme sonucu, reviewer ve nextAction.
- Şema: [prisma/schema/odk.prisma:284](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/odk.prisma#L284).
- Mevcut kısıt ve indeksler: `@@index([studentId, takenAt])`; `@@index([exam, takenAt])`; `@@index([examFamilyRefId])`
- İş kuralı ve sahiplik: [lib/panel/mock-exam-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/mock-exam-service.ts); şema alanı `odk`.
- Yeniden kullanım: **REFACTOR** → `Exam + ExamResult`.
- Tenant riski / değişiklik: Tanım ve öğrenci sonucu ayrılmalı; global User actor yerine kurum üyeliği gerekir.

### MockExamSection

- Amaç / ilişkiler: Deneme altındaki doğru/yanlış/boş sayıları.
- Şema: [prisma/schema/odk.prisma:311](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/odk.prisma#L311).
- Mevcut kısıt ve indeksler: `@@unique([mockExamId, subjectCode])`; `@@index([mockExamId, position])`
- İş kuralı ve sahiplik: [lib/panel/mock-exam-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/mock-exam-service.ts); şema alanı `odk`.
- Yeniden kullanım: **REFACTOR** → `ExamSection + ExamSectionResult`.
- Tenant riski / değişiklik: Tanım ve sonuç ayrılır; soru sayısı tutarlılığı ve aynı exam bileşik FK zorunlu.

### MockExamSectionError

- Amaç / ilişkiler: Bölüm hata nedeni ve revizyon yapan User.
- Şema: [prisma/schema/odk.prisma:331](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/odk.prisma#L331).
- Mevcut kısıt ve indeksler: `@@id([sectionId, category])`; `@@index([category, updatedAt])`
- İş kuralı ve sahiplik: [lib/panel/mock-exam-core.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/mock-exam-core.ts); şema alanı `odk`.
- Yeniden kullanım: **DEFER** → `Faz 08 hata kategorisi uzantısı`.
- Tenant riski / değişiklik: Temel sonuç modeli önce; hata taksonomisi ihtiyaç onayıyla tenant kapsamında eklenir.

### Notification

- Amaç / ilişkiler: User hedefli global bildirim, teslim/scheduling metadata.
- Şema: [prisma/schema/system.prisma:48](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/system.prisma#L48).
- Mevcut kısıt ve indeksler: `@@index([userId, readAt, createdAt])`; `@@index([deliveryPending, availableAt])`
- İş kuralı ve sahiplik: [lib/panel/study-notifications.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/study-notifications.ts); şema alanı `system`.
- Yeniden kullanım: **REWRITE** → `Notification + NotificationPreference`.
- Tenant riski / değişiklik: Üyelik hedefi, güvenli özet ve indirmede yeniden yetki gerekir; kurumlar arasında href sızıntısı önlenir.

### AuditLog

- Amaç / ilişkiler: Global entity/id, actor ve JSON payload; receipt olarak da kullanılır.
- Şema: [prisma/schema/system.prisma:142](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/system.prisma#L142).
- Mevcut kısıt ve indeksler: `idempotencyKey String?        @unique @map("idempotency_key")`; `@@index([entityType, entityId, createdAt])`; `@@index([createdAt])`
- İş kuralı ve sahiplik: [lib/panel/group-management-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/group-management-service.ts); şema alanı `system`.
- Yeniden kullanım: **REFACTOR** → `AuditLog + PlatformAuditLog`.
- Tenant riski / değişiklik: Tenant anahtarı yok; receipt anahtarı tenant/actor/digest ile kapsamlanır, PII payload kopyalanmaz.

### CoachAssignment

- Amaç / ilişkiler: StudentProfile ile TeacherProfile koçu; tarih aralığı.
- Şema: [prisma/schema/kocum.prisma:476](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/kocum.prisma#L476).
- Mevcut kısıt ve indeksler: `@@index([studentId, endedAt])`; `@@index([coachId, endedAt])`
- İş kuralı ve sahiplik: [lib/panel/coach-assignment-service.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/coach-assignment-service.ts); şema alanı `kocum`.
- Yeniden kullanım: **REFACTOR** → `StudentTeacherAssignment(kind=COACHING)`.
- Tenant riski / değişiklik: Koçluk ilişkisi aynı kurumda tanımlanır; cadence ve seanslar sonraki ürün kapsamı.

### StudentTeacherAssignment

- Amaç / ilişkiler: Öğrenci + global User öğretmen + serbest branş.
- Şema: [prisma/schema/kocum.prisma:444](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/kocum.prisma#L444).
- Mevcut kısıt ve indeksler: `@@unique([studentId, teacherId, subject])`; `@@index([teacherId, active])`; `@@index([studentId, active])`; `@@index([assignedById])`
- İş kuralı ve sahiplik: [lib/panel/teacher-roster.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/teacher-roster.ts); şema alanı `kocum`.
- Yeniden kullanım: **REFACTOR** → `StudentTeacherAssignment`.
- Tenant riski / değişiklik: TeacherRecord/Subject FK ve dönemli atama; bu ilişki tüm kurumu açamaz.

### CoachNote

- Amaç / ilişkiler: Öğrenci, User yazar, visibility=INTERNAL.
- Şema: [prisma/schema/kocum.prisma:365](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/kocum.prisma#L365).
- Mevcut kısıt ve indeksler: `@@index([studentId, visibility, createdAt])`; `@@index([authorId, createdAt])`
- İş kuralı ve sahiplik: [lib/panel/parent-coaching-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parent-coaching-server.ts); şema alanı `kocum`.
- Yeniden kullanım: **DEFER** → `Özel koçluk notu uzantısı`.
- Tenant riski / değişiklik: Özel/paylaşılan ayrımı korunacak; temel LessonNote dışındaki koçluk MVP şemasına alınmaz.

### WeeklyCoachSummary

- Amaç / ilişkiler: Öğrenci haftası; ayrı studentVisibleText/parentVisibleText.
- Şema: [prisma/schema/kocum.prisma:381](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/kocum.prisma#L381).
- Mevcut kısıt ve indeksler: `@@unique([studentId, weekStart])`; `@@index([status, weekStart])`
- İş kuralı ve sahiplik: [lib/panel/parent-coaching-server.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parent-coaching-server.ts); şema alanı `kocum`.
- Yeniden kullanım: **REFACTOR** → `PublishedFeedback`.
- Tenant riski / değişiklik: Audience ve yayın ayrımı yararlı, kurumlu sade geri bildirim modeline indirgenir.

### StudentProgressEvidence

- Amaç / ilişkiler: Öğrenci/kazanım/kaynak/product metrik kanıtı.
- Şema: [prisma/schema/system.prisma:285](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/system.prisma#L285).
- Mevcut kısıt ve indeksler: `@@unique([studentId, outcomeId, sourceType, sourceId])`; `@@index([studentId, outcomeId, occurredAt])`; `@@index([studentId, sourceType, occurredAt])`; `@@index([productRefId])`
- İş kuralı ve sahiplik: [docs/student-progress-evidence.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/student-progress-evidence.md); şema alanı `system`.
- Yeniden kullanım: **DEFER** → `Faz 08 kanıt projection uzantısı`.
- Tenant riski / değişiklik: Ürünler arası otomatik veri birleştirme taşınmaz; yalnız kurum içi kaynaklar kullanılabilir.

### StudentOutcomeMastery

- Amaç / ilişkiler: Öğrenci/kazanım türetilmiş mastery durumu.
- Şema: [prisma/schema/system.prisma:308](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/system.prisma#L308).
- Mevcut kısıt ve indeksler: `@@unique([studentId, outcomeId])`; `@@index([studentId, status])`
- İş kuralı ve sahiplik: [docs/outcome-mastery.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/outcome-mastery.md); şema alanı `system`.
- Yeniden kullanım: **DEFER** → `Talep halinde StudentProgressSnapshot`.
- Tenant riski / değişiklik: Ölçülmüş ihtiyaç olmadan projection tablosu eklenmez; kaynaklardan yeniden üretilebilir olmalı.

### BusinessRoleAssignment

- Amaç / ilişkiler: İş birimi başına çoklu işletme rolü.
- Şema: [prisma/schema/business.prisma:215](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/business.prisma#L215).
- Mevcut kısıt ve indeksler: `@@unique([userId, businessUnitId, role])`; `@@index([businessUnitId, role])`
- İş kuralı ve sahiplik: [docs/business-rbac.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/business-rbac.md); şema alanı `business`.
- Yeniden kullanım: **EXCLUDE** → `RoleAssignment için yalnız kavramsal örnek`.
- Tenant riski / değişiklik: BusinessUnit okul tenantı değildir; CRM ve finans RBAC kodu doğrudan taşınmaz.

### ProductMembership

- Amaç / ilişkiler: User bazlı ürün lisansı ve kaynak sipariş.
- Şema: [prisma/schema/business.prisma:815](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/business.prisma#L815).
- Mevcut kısıt ve indeksler: `@@unique([userId, product])`; `@@unique([userId, productRefId])`; `@@index([product, revokedAt, expiresAt])`; `@@index([grantedById, createdAt])`; `@@index([sourceOdOrderId])`; `@@index([productRefId])`
- İş kuralı ve sahiplik: [lib/auth/products.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/products.ts); şema alanı `business`.
- Yeniden kullanım: **EXCLUDE** → `Organization Subscription/FeatureEntitlement`.
- Tenant riski / değişiklik: B2C ürün hakkı B2B kurum üyeliği değildir; USER×ürün otomatik yetki verilmez.

### OdOrder

- Amaç / ilişkiler: Paket/sipariş, alıcı/öğrenci, provisioning ve ödeme.
- Şema: [prisma/schema/commerce.prisma:305](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/commerce.prisma#L305).
- Mevcut kısıt ve indeksler: `@@index([status, createdAt])`; `@@index([intentId])`; `@@index([userId, createdAt])`; `@@index([provisioningStatus, updatedAt])`; `@@index([buyerUserId, createdAt])`; `@@index([pendingChildId])`
- İş kuralı ve sahiplik: [docs/odk-commercial-product-contract.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/odk-commercial-product-contract.md); şema alanı `commerce`.
- Yeniden kullanım: **EXCLUDE** → `Faz 09 SubscriptionEvent`.
- Tenant riski / değişiklik: Paket satışı ve PayTR ticari varsayımları yeni kurum aboneliği değildir.

### OdkEntitlement

- Amaç / ilişkiler: User paket hakkı; order/line referansları.
- Şema: [prisma/schema/commerce.prisma:265](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/commerce.prisma#L265).
- Mevcut kısıt ve indeksler: `orderId          String?            @unique @map("order_id")`; `orderLineId      String?            @unique @map("order_line_id")`; `@@index([userId, revokedAt, expiresAt])`; `@@index([packageId])`
- İş kuralı ve sahiplik: [prisma/schema/commerce.prisma](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/prisma/schema/commerce.prisma); şema alanı `commerce`.
- Yeniden kullanım: **EXCLUDE** → `FeatureEntitlement`.
- Tenant riski / değişiklik: Siparişten öğrenci ürün hakkı yeni kurum planı için yanlış sahipliktir.

## Önemli doğrulama bulguları

- `lib/auth/resource-scopes.ts` ADMIN için `{}` döndürüyor ve `resource-scopes.test.ts` bunu bekliyor. Tek tenantta tasarlanmış bu davranış yeni üründe tenant filtresiz admin sorgusuna dönüştürülemez.
- `docs/panel-security.md` rol bazlı 30 dakika/7 gün gibi süreler anlatırken `lib/auth/session-policy.ts` bütün roller için 24 saat mutlak ve idle süre uyguluyor. Yeni oturum politikası belgeye değil açık Faz 03 kararına dayanır.
- `lib/panel/group-management-service.ts` hem schema limitini hem create kapasitesini DEFAULT_GROUP_CAPACITY ile kuruyor; sadece Prisma default kaldırmak yeterli değildir. İşlem kilidi/receipt/digest örüntüsü yararlıdır.
- `app/api/panel/materials/[id]/file/route.ts` kaynak scope ile dosya metadata sorgulayıp private blob stream ediyor; provider/token ve global rol kodu taşınmaz.
- `lib/panel/education-handlers/assignment-submissions-id-review.ts` status+version koşullu update ile yarışa 409 verir; rubric ve OD ürün personeli şartları yeni ürün için yeniden değerlendirilir.
- `docs/adr/0014-cok-dosyali-prisma-semasi-ve-sql-bootstrap.md` db push ile SQL partial index/CHECK/trigger kaybını belgeliyor. Yeni bootstrap da migration geçmişinden kurulmalıdır.

## İncelenen test ve belge kanıtları

- [resource-scopes.test.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/resource-scopes.test.ts): veli canlı bağlantısı ve enrollment; admin boş kapsam testi yeni modelde tersine çevrilecek.
- [lesson-series-schedule.test.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/lesson-series-schedule.test.ts): önizleme ve gerçek oluşturma tarihleri aynı girdiden eşit üretilmeli.
- [session-policy.test.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/session-policy.test.ts), [invitation.test.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/auth/invitation.test.ts): süre ve token davranışı test örnekleri.
- [panel/layout.tsx](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/app/panel/layout.tsx): layout guard tek başına yetmez açıklaması; her veri sınırı ayrı kontrol edilir.
- [parent-scope.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parent-scope.ts), [parent-calm.ts](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/lib/panel/parent-calm.ts): yanlış çocuk id’si 404, gizlenen kategori listesi.
- [data-model-ownership.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/data-model-ownership.md), [security-and-kvkk.md](https://github.com/TerekliTahaBerk/online-dershanem/blob/666d37d7c0d78d816af1517f4f6db8029f633632/docs/security-and-kvkk.md): alan gruplaması ve operasyon yaklaşımı; eski CRM retention süreleri yeni eğitim ürünü için hukuki dayanak sayılmaz.

İnceleme bu mimari soruları kapsayan kaynak analiziyle sınırlıdır; eski sistem için kapsamlı güvenlik denetimi veya test başarısı iddiası değildir.
