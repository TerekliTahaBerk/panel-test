# PostgreSQL / Prisma veri modeli sözleşmesi

Bu dosya uygulamaya alınacak model tanımıdır; aktif Prisma şeması veya migration değildir. Faz 02 yalnız **02** işaretli çekirdeği uygular. **03** kimlik fazında, **06/07/08/09** ilgili alan fazında eklenir; böylece veri tabanı önceden gereksiz tablolarla doldurulmaz.

## Ortak fiziksel sözleşme

PK aksi belirtilmedikçe `id String @id @default(uuid()) @db.Uuid`; tüm zamanlar `DateTime @db.Timestamptz(3)`, takvim günü `@db.Date`, para küçük birimde BigInt + ISO currency, net/puan `Decimal @db.Decimal(10,4)` olur. Kod/slug uzunlukları uygulamada ve DB CHECK ile sınırlanır. Oluşturma/güncelleme zamanları zorunludur; değişmez event/result kanıtında updatedAt gerekmez. Tablodaki `?` nullable, diğer alanlar zorunludur. FK listesinde verilen tüm hedefler, açıkça global denmedikçe aynı kurumdan bileşik FK'dır.

**Global tablolar:** User, UserIdentity, Session, RecoveryToken, PlatformRoleAssignment, Plan, FeatureEntitlement, PlatformAuditLog. Organization kök tenant kaydıdır. Diğer tüm modellerde `organizationId UUID NOT NULL → Organization.id`, `(organizationId,id)` unique ve RLS bulunur; ilişki tablolarında bileşik PK ayrıca belirtilir. organizationId değişmez. Tenant FK'ları `(organizationId,targetId) → Target(organizationId,id)`, güncelleme/silmede RESTRICT'tir. Nullable FK yalnız targetId null yapılabilir; organizationId asla null yapılmaz. Cascade yalnız süresi dolmuş geçici kimlik verisi veya onaylı toplu purge içindir.

Kısaltmalar: U=unique, I=index, PI=SQL partial unique index. Her FK'nın sorgulanan child alanlarına index eklenir; aynı prefix'i karşılayan U/I varsa tekrar eklenmez. Tablodaki I alanları tenant tablolarında organizationId ile başlar. Tenant listeleri `(organizationId,createdAt,id)` cursor kullanır. Serbest JSON yalnız sürümlü ve boyut sınırlı payload'dır, referans bütünlüğü yerine kullanılamaz.

## Kimlik ve kurum çekirdeği

| Model / faz / sorumluluk                       | Alanlar ve FK                                                                                                                  | Unique ve indeks                                                                   | Durum / silme                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| User / 02 / global kimlik                      | emailNormalized?, displayName?, status, authVersion=1                                                                          | emailNormalized U; I(status,id)                                                    | ACTIVE, SUSPENDED, DELETION_PENDING, ANONYMIZED; kimlik silme workflow, akademik cascade yok                 |
| Organization / 02 / tenant kökü                | slug, name, type, status, ownerMembershipId?; owner FK `(id,ownerMembershipId)` → Membership(org,id)                           | slug U; I(status,id)                                                               | DRAFT, ACTIVE, SUSPENDED, ARCHIVED; ACTIVE için owner zorunlu deferred trigger; toplu purge dışında RESTRICT |
| OrganizationMembership / 02 / User × kurum     | userId → global User, status, accessScope, version=1                                                                           | U(org,userId), U(org,id,userId); I(userId,status,org)                              | ACTIVE, SUSPENDED, REVOKED; tarihsel satır korunur                                                           |
| RoleAssignment / 02 / çoklu rol                | membershipId, role enum ADMIN/TEACHER/STUDENT/PARENT                                                                           | PK(org,membershipId,role); I(org,role,membershipId)                                | Üyelik aktifliğine bağlı; rol kaldırma audit ile fiziksel satır silme                                        |
| Branch / 02 / opsiyonel şube                   | code, name, status                                                                                                             | U(org,code); I(org,status,id)                                                      | ACTIVE, ARCHIVED; kayıt varsa silme RESTRICT                                                                 |
| BranchMembership / 02 / erişim kapsamı         | membershipId, branchId                                                                                                         | PK(org,membershipId,branchId); I(org,branchId,membershipId)                        | Açık grant; silme audit'li, tarih AuditLog'da                                                                |
| AuditLog / 02 / tenant denetimi                | actorMembershipId?, actorUserId? → global User, actorType, entityType, entityId, action, requestId, metadata?, idempotencyKey? | U(org,idempotencyKey); I(org,entityType,entityId,createdAt), I(org,createdAt,id)   | Append-only; runtime UPDATE/DELETE yok, retention ayrı rol                                                   |
| UserIdentity / 03 / sağlayıcı eşlemesi         | userId → global User, provider, subject, verifiedAt?                                                                           | U(provider,subject); I(userId)                                                     | ACTIVE, REVOKED; hesap bağlama step-up gerekir                                                               |
| Session / 03 / opak oturum                     | userId → global User, tokenHash, authVersion, expiresAt, lastSeenAt, revokedAt?, mfaVerifiedAt?, stepUpAt?                     | tokenHash U; I(userId,revokedAt), I(expiresAt)                                     | ACTIVE/EXPIRED/REVOKED tarihlerden türetilir; süreli purge                                                   |
| RecoveryToken / 03 / tek kullanımlık kurtarma  | userId → global User, tokenHash, purpose, expiresAt, consumedAt?                                                               | tokenHash U; I(userId,purpose), I(expiresAt)                                       | PENDING/USED/EXPIRED; süreli purge                                                                           |
| PlatformRoleAssignment / 03 / platform yetkisi | userId → global User, role=SUPER_ADMIN, revokedAt?                                                                             | U(userId,role); I(role,revokedAt)                                                  | Atama yalnız operasyon süreci; normal kayıt akışı yaratamaz                                                  |
| OrganizationInvitation / 03 / kurum daveti     | emailNormalized, tokenHash, roles enum[], accessScope, status, expiresAt, invitedByMembershipId, acceptedByMembershipId?       | tokenHash U; PI(org,emailNormalized) WHERE status=PENDING; I(org,status,expiresAt) | PENDING, ACCEPTED, EXPIRED, REVOKED; yarış koşullu update; 90 gün önerilen operasyon TTL                     |

Organization.ownerMembershipId yalnız aynı kurum üyeliğine bağlanır. Başlangıçta DRAFT + null owner oluşturulur, User/Membership eklenir, owner atanır ve ACTIVE yapılır; commit sonunda deferred constraint trigger ACTIVE kurumun owner üyeliğinin ACTIVE ve accessScope=ORGANIZATION olduğunu doğrular. Sahip üyeliğin status/accessScope güncellenmesinde de aynı kontrol çalışır. Böylece son sahip iptal edilemez. Sahip rol satırı tutulmaz.

### Davetin şube ilişkisi

OrganizationInvitationBranch (Faz 03), davetteki şube kapsamını FK ile taşır: `organizationId`, `invitationId`, `branchId`; PK(org,invitationId,branchId), I(org,branchId,invitationId). Her iki hedef aynı kurum bileşik FK'sıdır, silme RESTRICT. Yaşam döngüsü davete bağlıdır; kabulden sonra grant geçmişi audit'te korunur. Branch id'leri JSON dizisi olarak saklanmaz. BRANCHES daveti en az bir aktif şube ister; ORGANIZATION davetinde bu satırlar bulunmaz. Bu koşullar kabul transaction'ında kontrol edilir. Öğrenci/personel/veli hedef kayıt eşlemesi ilgili alan fazındaki servis tarafından yapılır; genel invitation payload'ından gelen id yetki sağlamaz.

## Akademik modeller

| Model / faz / sorumluluk                              | Alanlar ve FK                                                                                                   | Unique ve indeks                                                                                              | Durum / silme                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| StudentRecord / 06 / akademik kişi                    | membershipId?, branchId?, studentNumber, fullName, classLevel?, birthDate?, archivedAt?                         | U(org,studentNumber), U(org,membershipId); I(org,branchId,archivedAt,id)                                      | ACTIVE, ARCHIVED; hesap yokken de açılır, akademik purge kontrollü             |
| TeacherRecord / 06 / kurum personeli                  | membershipId?, staffNumber, fullName, status, isCoach=false                                                     | U(org,staffNumber), U(org,membershipId); I(org,status,id)                                                     | INVITED, ACTIVE, INACTIVE, ARCHIVED; geçmiş yazar korunur                      |
| Subject / 06 / kurum ders sözlüğü                     | code, name, archivedAt?                                                                                         | U(org,code); I(org,archivedAt,id)                                                                             | Aktif/arşiv; kullanım varsa RESTRICT                                           |
| Group / 06 / sınıf veya ders grubu                    | branchId?, subjectId, teacherRecordId, code, name, capacity Int?, status                                        | U(org,code); U(org,id,branchId); I(org,teacherRecordId,status), I(org,branchId,status)                        | ACTIVE, ARCHIVED; capacity null veya >0; geçmiş varsa RESTRICT                 |
| Enrollment / 06 / grup öğrenci dönemi                 | groupId, studentRecordId, startedAt, endedAt?                                                                   | PI(org,groupId,studentRecordId) WHERE endedAt IS NULL; I(org,studentRecordId,endedAt)                         | OPEN/ENDED tarihten; endedAt>=startedAt; dönemler servis tarafından çakışmasız |
| StudentTeacherAssignment / 06 / bireysel öğretmen/koç | studentRecordId, teacherRecordId, subjectId?, kind=TEACHING/COACHING, startedAt, endedAt?                       | I(org,teacherRecordId,endedAt), I(org,studentRecordId,endedAt); aktif çift için nullable subject dahil SQL PI | Açık/biten atama; history korunur                                              |
| LessonSeries / 06 / tekrar tanımı                     | groupId, teacherRecordId, timezone, localStartTime, weekdays Int[], startsOn, endsOn?, durationMinutes, version | I(org,groupId,startsOn), I(org,teacherRecordId,startsOn); U(org,id,groupId)                                   | ACTIVE, ENDED, CANCELLED; geçmiş dersler değişmez                              |
| Lesson / 06 / fiili ders                              | groupId, teacherRecordId, seriesId?, startsAt, endsAt, status, version                                          | U(org,seriesId,startsAt); U(org,id,groupId); I(org,teacherRecordId,startsAt), I(org,groupId,startsAt)         | PLANNED, COMPLETED, CANCELLED; endsAt>startsAt; silme yerine iptal             |
| Attendance / 06 / ders öğrenci yoklaması              | lessonId, studentRecordId, status, recordedByMembershipId, version                                              | U(org,lessonId,studentRecordId); I(org,studentRecordId,createdAt)                                             | PRESENT, ABSENT, LATE, EXCUSED; audit'li düzeltme; otomatik PRESENT yok        |
| LessonNote / 06 / özel not                            | lessonId, studentRecordId?, authorTeacherRecordId, body, version                                                | I(org,authorTeacherRecordId,createdAt), I(org,lessonId)                                                       | PRIVATE, ARCHIVED; sadece yazar + halen atanmış öğretmen; DTO ayrıdır          |

TeacherRecord şube yetkisi Membership + BranchMembership'ten gelir; personel kaydına tek şube dayatılmaz. Öğrencinin branchId'si ile Group.branchId farklıysa enrollment reddedilir; şubeler arası eğitim MVP dışında. Null/null şubesiz eşleşme geçerlidir. Bu kural parent tablolarda da değişim olduğunda çalışan deferred trigger ile korunur. Kurum kapsamındaki personel tüm şubeleri yönetebilir, öğrenciyi yanlış şubeye kaydedemez.

## Öğrenme ve iletişim

| Model / faz / sorumluluk                        | Alanlar ve FK                                                                                                                                                                                                             | Unique ve indeks                                                                                               | Durum / silme                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Assignment / 06 / grup ödevi                    | groupId, lessonId?, authorTeacherRecordId, title, instructions?, dueAt?, status, version                                                                                                                                  | U(org,id,groupId); I(org,groupId,dueAt), I(org,status,dueAt)                                                   | DRAFT, PUBLISHED, WITHDRAWN, ARCHIVED; kanıtları cascade etmez                            |
| AssignmentProgress / 06 / alıcı ve durum        | assignmentId, studentRecordId, status, completedAt?, version                                                                                                                                                              | U(org,assignmentId,studentRecordId); U(org,id,assignmentId,studentRecordId); I(org,studentRecordId,status)     | TODO, IN_PROGRESS, DONE; alıcı listesi yayımlamada snapshot                               |
| AssignmentSubmission / 06 / teslim denemesi     | progressId, assignmentId, studentRecordId, attemptNumber, evidenceText?, storageKey?, status, feedback?, reviewerMembershipId?, reviewedAt?, idempotencyKey, version                                                      | U(org,assignmentId,studentRecordId,attemptNumber), U(org,idempotencyKey); I(org,assignmentId,status,createdAt) | SUBMITTED, CHANGES_REQUESTED, APPROVED; kanıt değişmez, inceleme optimistic locking       |
| LearningMaterial / 06 / grup kaynağı            | groupId, lessonId?, assignmentId?, authorTeacherRecordId, kind, title, url?, storageKey?, mimeType?, byteSize?, status                                                                                                    | I(org,groupId,status,createdAt); storageKey için U(org,storageKey)                                             | DRAFT, PUBLISHED, ARCHIVED; URL veya private object, silme iki aşamalı                    |
| GuardianRecord / 07 / kurum veli kaydı          | membershipId?, fullName, contactEmail?, status                                                                                                                                                                            | U(org,membershipId); I(org,status,id)                                                                          | INVITED, ACTIVE, INACTIVE, ARCHIVED; hesapsız kayıt mümkün                                |
| ParentStudentRelationship / 07 / açık veli bağı | guardianRecordId, studentRecordId, relationshipType, verifiedByMembershipId?, verifiedAt?, endedAt?, canViewAttendance=false, canViewAssignments=false, canViewExams=false, canViewProgress=false, canViewSummaries=false | U(org,guardianRecordId,studentRecordId); I(org,studentRecordId,endedAt)                                        | PENDING, ACTIVE, REVOKED; ACTIVE için verifiedAt zorunlu; değişim AuditLog                |
| PublishedFeedback / 07 / paylaşılabilir özet    | studentRecordId, lessonId?, authorTeacherRecordId, audience=STUDENT/GUARDIAN/BOTH, body, status, publishedAt?, version                                                                                                    | I(org,studentRecordId,status,publishedAt)                                                                      | DRAFT, PUBLISHED, WITHDRAWN; özel not gövdesine referans verilmez                         |
| Notification / 07 / kurum içi bildirim          | recipientMembershipId, type, safeSummary, resourceType?, resourceId?, readAt?, deliveryKey                                                                                                                                | U(org,deliveryKey); I(org,recipientMembershipId,readAt,createdAt)                                              | UNREAD/READ tarihten; hedefe tıklamada tekrar yetki; payload özel veri içermez            |
| NotificationPreference / 07 / kanal tercihi     | membershipId, category, channel, enabled                                                                                                                                                                                  | PK(org,membershipId,category,channel)                                                                          | Uygulama içi zorunlu güvenlik bildirimleri pazarlamadan ayrılır; üyelik purge ile silinir |

AssignmentSubmission FK'sı `(org,progressId,assignmentId,studentRecordId)` → AssignmentProgress(org,id,assignmentId,studentRecordId) olur. Böylece başka ödev/öğrenci progress'ine bağlanamaz. Lesson.seriesId FK'sı `(org,seriesId,groupId)` → LessonSeries(org,id,groupId); Assignment.lessonId ve LearningMaterial.lessonId FK'sı `(org,lessonId,groupId)` → Lesson(org,id,groupId); LearningMaterial.assignmentId aynı şekilde Assignment(org,id,groupId) hedefler. Aynı kurumda yanlış gruba bağlama da DB'de engellenir.

## Sınav ve abonelik

| Model / faz / sorumluluk                       | Alanlar ve FK                                                                              | Unique ve indeks                                                                              | Durum / silme                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Exam / 08 / sınav tanımı                       | code, title, family, scoringRule Json, ruleVersion, status                                 | U(org,code); I(org,status,createdAt)                                                          | DRAFT, PUBLISHED, ARCHIVED; yayımdan sonra kural değişikliği yeni sürüm/tanım       |
| ExamSection / 08 / ders bölümü                 | examId, subjectId, code, questionCount, position                                           | U(org,examId,code), U(org,id,examId); I(org,examId,position)                                  | Sınav yaşam döngüsü; questionCount>0                                                |
| ExamResult / 08 / öğrenci denemesi             | examId, studentRecordId, attemptNumber, takenAt, status, enteredByMembershipId, version    | U(org,examId,studentRecordId,attemptNumber), U(org,id,examId); I(org,studentRecordId,takenAt) | DRAFT, PUBLISHED, INVALIDATED; fiziksel silme yok                                   |
| ExamSectionResult / 08 / sayısal bölüm sonucu  | examId, examResultId, examSectionId, correctCount, incorrectCount, blankCount, net Decimal | U(org,examResultId,examSectionId); I(org,examSectionId)                                       | Result durumuna bağlı; sayılar >=0                                                  |
| Plan / 09 / global sürümlü katalog             | code, version, name, status, priceMinor?, currency?                                        | U(code,version); I(status)                                                                    | DRAFT, ACTIVE, RETIRED; eski sözleşmeler korunur                                    |
| FeatureEntitlement / 09 / plan hakkı           | planId → global Plan, featureKey, enabled, limit BigInt?                                   | U(planId,featureKey)                                                                          | Plan sürümüyle değişmez; null limitsiz, negatif yasak                               |
| Subscription / 09 / kurum aboneliği            | planId → global Plan, status, periodStart, periodEnd, provider?, externalId?, version      | organizationId U; U(provider,externalId); I(org,status,periodEnd)                             | TRIALING, ACTIVE, PAST_DUE, CANCELLED; borçlu durum okuma/silme haklarını yok etmez |
| SubscriptionEvent / 09 / webhook geçmişi       | subscriptionId, provider, eventId, eventType, payloadHash, receivedAt, processedAt?        | U(provider,eventId); I(org,subscriptionId,receivedAt)                                         | RECEIVED, APPLIED, FAILED, IGNORED; append-only payload, durum denetimli güncelleme |
| UsageRecord / 09 / dönemsel sayaç              | subscriptionId, metric, periodStart, periodEnd, quantity BigInt, version                   | U(org,metric,periodStart); I(org,subscriptionId,periodStart)                                  | OPEN, SEALED; quantity>=0, atomik increment; kaynakla uzlaştırma                    |
| PlatformAuditLog / 03 / global kimlik denetimi | actorUserId? → global User, action, targetType, targetId, requestId, metadata?, createdAt  | I(targetType,targetId,createdAt), I(createdAt,id)                                             | Append-only; kurum akademik payload'ı yok; ayrı erişim ve retention                 |

ExamSectionResult FK'ları `(org,examResultId,examId)` → ExamResult(org,id,examId) ve `(org,examSectionId,examId)` → ExamSection(org,id,examId) olur. Toplam doğru+yanlış+boş = questionCount ilişkili CHECK ile yapılamaz; result/section değişiminde deferred trigger doğrular. net sunucuda sürümlü kuralla hesaplanır, istemci net'i kabul edilmez.

## Prisma örneği (yalnız dokümantasyon)

Aşağıdaki parça bileşik FK biçimini gösterir; tam schema değildir, eksik Organization ters ilişkileri gerçek uygulamada eklenir. Relation mode `foreignKeys` kullanılmalıdır; yalnız ORM emülasyonu seçilmez.

```prisma
model StudentRecord {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  studentNumber  String
  fullName       String
  enrollments    Enrollment[]

  @@unique([organizationId, id])
  @@unique([organizationId, studentNumber])
}

model Group {
  id             String @id @default(uuid()) @db.Uuid
  organizationId String @db.Uuid
  code           String
  capacity       Int?
  enrollments    Enrollment[]

  @@unique([organizationId, id])
  @@unique([organizationId, code])
}

model Enrollment {
  id              String @id @default(uuid()) @db.Uuid
  organizationId  String @db.Uuid
  groupId         String @db.Uuid
  studentRecordId String @db.Uuid
  startedAt       DateTime @db.Timestamptz(3)
  endedAt         DateTime? @db.Timestamptz(3)
  group Group @relation(fields: [organizationId, groupId], references: [organizationId, id], onDelete: Restrict, onUpdate: Restrict)
  student StudentRecord @relation(fields: [organizationId, studentRecordId], references: [organizationId, id], onDelete: Restrict, onUpdate: Restrict)

  @@unique([organizationId, id])
  @@index([organizationId, studentRecordId, endedAt])
}
```

SQL migration tasarımında ayrıca partial index, CHECK, RLS, değişmez organizationId ve deferred trigger'lar bulunur. Prisma temsili tek başına tam DB sözleşmesi değildir. Aktif enrollment PI, kapasite ve tarih aralığı yarış testleri Faz 06'da eklenir; Faz 02 yalnız çekirdekteki FK/RLS sözleşmesini doğrular.

## İşlem, migration ve altyapı

PostgreSQL + Prisma önerilir; sürüm ve driver adapter Faz 02 başlangıcında birlikte sabitlenir. Eski projedeki Prisma 6.19.3 sürümü otomatik kopyalanmaz. [Resmî bağlantı dokümanı](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) havuz bütçesi ve bağlantı ayarları için başlangıç kaynağıdır; seçilen sürümün komut/config API'si lockfile ile doğrulanmalıdır.

Uygulama transaction pooling endpoint'i, migration ve restore doğrudan bağlantı kullanır. Havuz kapasitesi instance sayısı × instance havuzu üzerinden DB bütçesinin altında tutulur; timeout ve eşzamanlı iş sınırı tanımlanır. Transaction içinde dış ağ çağrısı yoktur. Kapasite, sahiplik devri, davet kabulü ve kota değişimi kilit/koşullu update ile atomiktir; serialization/deadlock hataları aynı idempotency anahtarıyla en çok üç sınırlı jitter'lı tekrar, ardından 409 üretir.

Dev ve CI izole boş DB'lerdir; migration dosyaları tek kaynak, `db push` bootstrap yöntemi değildir. Staging/prod birbirinden ayrı kullanıcı/parola ve DB taşır. Migration tek CI/CD işiyle, uygulama runtime rolünden farklı DDL rolüyle uygulanır. Expand → backfill → validate → contract; kaldırıcı adım eski uygulama sürümü kullanım dışı kalmadan yapılmaz. Başarısız migration sonrası otomatik reset yok; ileri düzeltme veya restore runbook'u uygulanır.

Sağlayıcı kararı açıktır: yerleşim, maliyet, PITR, havuzlama ve test ortamı desteği Faz 02 öncesi değerlendirilir. Bu fazda servis açılmaz. Şifreli backup, PITR ve restore tatbikatı üretim önkoşuludur. Tasarım hedefi RPO ≤24 saat, RTO ≤8 saat; sözleşme ve ölçüm olmadan garanti değildir. İleride enterprise hedefleri ayrı karar ister.
