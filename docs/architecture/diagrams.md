# Mimari ve ilişki diyagramları

İlişkiler [database-design.md](database-design.md) ile eşleşir. ERD'ler okunabilirlik için tüm sütunları göstermez. Tenant bağlantıları organizationId içeren bileşik FK'dır; User/Plan global hedefleri istisnadır. Çizimdeki `org` kısaltması fiziksel organizationId'dir.

## 1. Modüler mimari

```mermaid
flowchart TD
  UI[Mevcut Next.js UI ve shell] --> ENTRY[RSC / Route Handler / Server Action]
  ENTRY --> POLICY[Session + TenantContext + Policy]
  POLICY --> ORG[Organizations]
  POLICY --> AC[Academic]
  POLICY --> LE[Learning]
  POLICY --> EX[Exams ve Analytics]
  POLICY --> CO[Communication]
  POLICY --> BI[Billing]
  ORG --> ID[Identity]
  AC --> ORG
  LE --> AC
  EX --> AC
  EX --> LE
  CO --> AC
  CO --> ORG
  BI --> ORG
  ENTRY --> AU[AuditWriter portu]
  AU --> OPS[Operations]
  AC --> DB[(PostgreSQL: FK + RLS)]
  ORG --> DB
  LE --> DB
  EX --> DB
  CO --> DB
  BI --> DB
```

## 2. Kurum ve kimlik

```mermaid
erDiagram
  User ||--o{ OrganizationMembership : katilir
  User ||--o{ UserIdentity : dogrulanir
  User ||--o{ Session : oturum
  User ||--o{ PlatformRoleAssignment : platform
  Organization ||--o{ OrganizationMembership : uyeler
  Organization o|--o| OrganizationMembership : sahip
  OrganizationMembership ||--o{ RoleAssignment : roller
  Organization ||--o{ Branch : subeler
  OrganizationMembership ||--o{ BranchMembership : kapsam
  Branch ||--o{ BranchMembership : izin
  Organization ||--o{ OrganizationInvitation : davetler
  OrganizationInvitation ||--o{ OrganizationInvitationBranch : davet_kapsami
  Branch ||--o{ OrganizationInvitationBranch : sube
  Organization {
    uuid id PK
    string slug UK
    uuid createdByUserId FK
    string provisioningKeyHash
    string provisioningRequestHash
    uuid ownerMembershipId FK
  }
  OrganizationMembership {
    uuid id PK
    uuid organizationId FK
    uuid userId FK
    string accessScope
    string status
  }
```

Sahip çizgisi nullable DRAFT kurum içindir; ACTIVE kurumda tam bir aktif sahip zorunludur. Membership'in en fazla bir kurumun sahibi olabilmesi aynı-tenant FK ile sağlanır; farklı kuruma ait sahip olamaz.

## 3. Akademik alan

```mermaid
erDiagram
  OrganizationMembership o|--o| StudentRecord : hesap_bagi
  OrganizationMembership o|--o| TeacherRecord : personel_bagi
  Branch o|--o{ StudentRecord : opsiyonel
  Branch o|--o{ Group : opsiyonel
  Subject ||--o{ Group : ders
  TeacherRecord ||--o{ Group : varsayilan
  StudentRecord ||--o{ Enrollment : katilim
  Group ||--o{ Enrollment : donem
  Group ||--o{ LessonSeries : tekrar
  Group ||--o{ Lesson : dersler
  LessonSeries o|--o{ Lesson : olusum
  TeacherRecord ||--o{ Lesson : fiili_ogretmen
  Lesson ||--o{ Attendance : yoklama
  StudentRecord ||--o{ Attendance : ogrenci
  Lesson ||--o{ LessonNote : ozel_not
  Group ||--o{ Assignment : odev
  Assignment ||--o{ AssignmentProgress : alicilar
  StudentRecord ||--o{ AssignmentProgress : durum
  AssignmentProgress ||--o{ AssignmentSubmission : denemeler
  Group ||--o{ LearningMaterial : kaynaklar
  StudentRecord ||--o{ StudentTeacherAssignment : bireysel
  TeacherRecord ||--o{ StudentTeacherAssignment : atama
```

## 4. Veli ve öğrenci mahremiyet sınırı

```mermaid
erDiagram
  User ||--o{ OrganizationMembership : kimlik
  OrganizationMembership o|--o| GuardianRecord : veli_hesabi
  GuardianRecord ||--o{ ParentStudentRelationship : dogrulanmis_bag
  StudentRecord ||--o{ ParentStudentRelationship : cocuk
  StudentRecord ||--o{ PublishedFeedback : yayin
  TeacherRecord ||--o{ PublishedFeedback : yazar
  TeacherRecord ||--o{ LessonNote : ozel_yazar
  StudentRecord o|--o{ LessonNote : opsiyonel_ogrenci
  ParentStudentRelationship {
    uuid organizationId FK
    uuid guardianRecordId FK
    uuid studentRecordId FK
    string status
    boolean canViewAttendance
    boolean canViewAssignments
    boolean canViewExams
    boolean canViewProgress
    boolean canViewSummaries
  }
```

Veliye giden okuma yayımlanmış DTO + kategori izni üzerinden yapılır. LessonNote'a veli ilişkisi çizilmemesi bilinçli gizlilik kararıdır.

## 5. Tenant farkında istek

```mermaid
sequenceDiagram
  participant C as İstemci
  participant E as Sunucu giriş noktası
  participant I as Identity
  participant O as Organizations bootstrap
  participant P as Policy / Alan servisi
  participant R as Tenant repository
  participant D as PostgreSQL
  C->>E: Session cookie + orgSlug + kaynak id
  E->>I: Token, durum, expiry, revoke, MFA doğrula
  I-->>E: Doğrulanmış User
  E->>O: Aday slug + User ile aktif üyelik doğrula
  O-->>E: TenantContext veya erişim reddi
  E->>P: Eylem + kaynak + TenantContext
  P->>R: Tenant + şube + ilişki kapsamı
  R->>D: BEGIN ve transaction-local tenant context
  R->>D: Kapsamlı sorgu / koşullu yazma + audit
  D-->>R: FK / RLS / sürüm kontrolü
  R-->>P: Sonuç
  P-->>E: Alan allowlist DTO
  E-->>C: Güvenli yanıt
```

## 6. Abonelik ve sınav uzantıları

```mermaid
erDiagram
  Organization ||--o| Subscription : guncel
  Plan ||--o{ Subscription : surumlu_plan
  Plan ||--o{ FeatureEntitlement : haklar
  Subscription ||--o{ SubscriptionEvent : gecmis
  Subscription ||--o{ UsageRecord : kullanim
  Organization ||--o{ Exam : tanim
  Exam ||--o{ ExamSection : bolum
  Exam ||--o{ ExamResult : katilim
  StudentRecord ||--o{ ExamResult : sonuc
  ExamResult ||--o{ ExamSectionResult : sayilar
  ExamSection ||--o{ ExamSectionResult : eslesme
```

Subscription bir kuruma tek güncel satırdır; geçmiş event'lerle tutulur. Sınav/abonelik tabloları Faz 02 migration kapsamına girmez.

## 7. İlk kurumun kurulumu (normal tenant resolver'dan ayrı)

```mermaid
sequenceDiagram
  participant U as Faz 05 kurulum istemcisi
  participant A as Faz 03 auth adapter
  participant S as createOrganizationWithOwner
  participant P as Dar provisioning DB fonksiyonu
  participant D as PostgreSQL + role scoped RLS
  participant R as Normal tenant resolver
  U->>A: Oturum + doğrulanmış email + güncel MFA
  A-->>S: VerifiedPrincipal (TenantContext yok)
  S->>P: Normalize input + actor + idempotency key
  P->>D: BEGIN SERIALIZABLE / actor lock / replay kontrolü
  alt Aynı actor-key-digest kaydı yok
    P->>D: Yeni DRAFT + ACTIVE owner Membership
    P->>D: ownerMembershipId ata / Organization ACTIVE
    P->>D: Audit + deferred owner constraint
  else Geçerli tekrar
    P->>D: Yalnız önceki işlem ve actor üyeliğini oku
  end
  D-->>S: COMMIT başarılı, dar sonuç
  Note over P,D: Her adımda hata = tam ROLLBACK; replay mutation yapmaz
  S->>R: Commit sonrası principal + slug
  R-->>U: Normal doğrulama sonrası workspace
```

Fonksiyon existing tenant id/rol/owner almaz; caller yalnız EXECUTE, function-owner NOLOGIN/NOBYPASSRLS ve tablo sahibi değildir. Normal tenant runtime provisioning yetkisi kazanmaz. Metadata ve ayrıntılı RLS/kurtarma sözleşmesi [ilk kurum kurulumu belgesindedir](organization-provisioning.md).

## 8. Junction fiziksel anahtarları (surrogate id yok)

```mermaid
erDiagram
  OrganizationMembership ||--o{ RoleAssignment : roller
  OrganizationMembership ||--o{ BranchMembership : kapsam
  Branch ||--o{ BranchMembership : sube
  OrganizationInvitation ||--o{ OrganizationInvitationBranch : davet
  Branch ||--o{ OrganizationInvitationBranch : sube
  OrganizationMembership ||--o{ NotificationPreference : tercih
  RoleAssignment {
    uuid organizationId PK
    uuid membershipId PK
    string role PK
  }
  BranchMembership {
    uuid organizationId PK
    uuid membershipId PK
    uuid branchId PK
  }
  OrganizationInvitationBranch {
    uuid organizationId PK
    uuid invitationId PK
    uuid branchId PK
  }
  NotificationPreference {
    uuid organizationId PK
    uuid membershipId PK
    string category PK
    string channel PK
    boolean enabled
  }
```

Aynı tablodaki tüm PK işaretli alanlar **tek bileşik PK** oluşturur. Tüm parent çizgileri organizationId içeren FK'dır; ayrıca Organization köküne FK vardır. id ve U(org,id) bu dört tabloda yoktur. Ek indeksler RoleAssignment(org,role,membershipId), BranchMembership(org,branchId,membershipId), OrganizationInvitationBranch(org,branchId,invitationId); NotificationPreference için PK yeterlidir. Dördünde tenant RLS USING/WITH CHECK, deny-on-missing-context ve server izinleri geçerlidir.

Akademik diyagramdaki StudentRecord ve Group branch'i opsiyoneldir; Enrollment için geçerli çiftler null/null ve A/A, yasak çiftler null/A, A/null, A/B'dir. OrganizationId FK ve null-safe deferred constraint birlikte çalışır; diagramdaki opsiyonellik wildcard erişim değildir. Parent branch değişimi ve concurrent enrollment testleri [DB sözleşmesine](database-design.md) bağlıdır.
