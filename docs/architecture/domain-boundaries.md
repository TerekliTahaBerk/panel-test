# Alan sınırları ve bağımlılıklar

Durum: Faz 01 tasarım kararı; çalışma zamanı uygulaması değildir. Teknik sahipler ekip rolüdür; kişi ataması ürün sahibi tarafından Faz 02 başlangıcında yapılır.

| Alan / modül                     | Teknik sahip                  | Yazma yetkisi ve sorumluluğu                                                                                                     | İzin verilen bağımlılıklar                            |
| -------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Identity & Access / identity     | Kimlik mühendisi              | User, UserIdentity, Session, RecoveryToken, PlatformRoleAssignment; kimlik doğrulama                                             | Ortak hata ve saat araçları                           |
| Organizations / organizations    | Tenant altyapı mühendisi      | Organization, Membership, RoleAssignment, Invitation, Branch, BranchMembership; yaşam döngüsü                                    | Identity kimlik referansı                             |
| Academic Core / academic         | Eğitim alan mühendisi         | StudentRecord, TeacherRecord, Subject, Group, Enrollment, LessonSeries, Lesson, Attendance, LessonNote, StudentTeacherAssignment | Organizations sözleşmeleri                            |
| Learning / learning              | Öğrenme alan mühendisi        | Assignment, AssignmentProgress, AssignmentSubmission, LearningMaterial                                                           | Academic salt okunur kapsam sözleşmeleri              |
| Exams & Analytics / exams        | Ölçme değerlendirme mühendisi | Exam, ExamSection, ExamResult, ExamSectionResult; hesaplama                                                                      | Academic kapsamı; Learning yayımlanmış ölçümleri      |
| Communication / communication    | İletişim mühendisi            | GuardianRecord, ParentStudentRelationship, Notification, NotificationPreference, PublishedFeedback                               | Organizations ve Academic ilişki doğrulaması          |
| Billing / billing                | Abonelik mühendisi            | Plan, Subscription, SubscriptionEvent, FeatureEntitlement, UsageRecord                                                           | Organizations kimliği                                 |
| Platform Operations / operations | Platform güvenlik mühendisi   | AuditLog, PlatformAuditLog; destek iş akışı                                                                                      | Diğer alanların yalnız denetim/operasyon sözleşmeleri |

Modüler monolit korunur. Next.js giriş katmanı `src/app` içindeki RSC, Route Handler ve Server Action'lardan alan servislerini çağırır. Gelecekte sunucu kodu `src/server/modules/<alan>/{service,repository,policy,contracts}.ts` altında tutulur; mevcut `src/features` sunum kodu ve tasarım sistemi korunur. Faz 01 bu dizinleri oluşturmaz.

Alanlar başka alanın Prisma repository'sini veya iç tiplerini doğrudan içe aktaramaz. Başka alanın satırına yazamaz; FK varlığı alan sahipliğini değiştirmez. İzin kontrolü ortak sunucu policy katmanındadır ve ilgili alanın kapsam sorgusunu kullanır. Organizations, Academic veya Billing'i import etmez. Döngüyü önlemek için Academic, Communication'ı çağırmaz: uygulama servisi kayıt işlemini ve geri bildirim yayımlamayı orkestre eder. Denetim ekleme dar bir `AuditWriter` portudur; operations modülünün tamamına bağımlılık oluşturmaz.

Tek PostgreSQL işlemi içindeki çapraz alan değişikliği uygulama servisinde koordine edilir; repository'lere aynı transaction client verilir. Örn. davet kabulü kimlik bağlama + üyelik + roller + kayıt bağlama + audit işlemleridir. E-posta/nesne depolama gibi ağ işlemleri transaction içinde yapılmaz. Güvenilir asenkron teslim gerektiğinde alan fazında transactional outbox eklenir; Faz 02'ye broker/worker zorunluluğu getirilmez.

Billing, kimlik veya rol vermez. Subscription/entitlement sonucu yalnız özellik erişimine ve kotaya ek koşuldur. Ders verisinden usage türetimi uygulama servisinde olur; billing akademik kayıtların sahibi değildir. Operations için genel tenant filtresiz repository açılmaz.

Kaynak kanıtı: hedef `src/features/dashboard/components/admin-dashboard.tsx`, `src/features/workspace/types.ts`, `src/config/navigation.ts`; eski `lib/panel/group-management-service.ts` işlem sınırı örneği. Eski geniş `lib/panel` yapısı yeni modül sınırı olarak aynen taşınmaz.
