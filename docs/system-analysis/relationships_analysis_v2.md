# تحديد العلاقات بين الكيانات — النسخة المصحّحة (v2)

## مقدمة

هذا المستند **نسخة مراجَعة** لمخطط علاقات كيانات منصة ZONES، بعد تطبيق **مبادئ ERD** (Entity-Relationship Diagram) ومراجعة المخطط السابق مقابل قاعدة البيانات الفعلية.

**المصدر:** Foreign Keys + Spatie RBAC + migrations Laravel

---

## مبادئ رسم ERD المطبّقة

| المبدأ | التطبيق في ZONES |
|--------|------------------|
| **الكيان (Entity)** | مستطيل — مثل `users`, `stations`, `bookings` |
| **العلاقة (Relationship)** | معيّن ◇ — فعل يربط كيانين (يدير، يحجز، يعمل في) |
| **Cardinality** | 1, N, M على طرفي العلاقة — مستخرجة من FK |
| **التخصص (Specialization)** | المستخدم كيان واحد في DB، لكن **الدور** يحدد علاقته |
| **جدول وسيط** | N:M عبر pivot — `service_station`, `model_has_roles` |
| **مشاركة اختيارية** | 0..1 عند nullable FK — مثل `device_fault_id` |
| **لا علاقة مباشرة** | إذا وُجد جدول وسيط — لا ترسم سهماً مباشراً |

### رموز Cardinality

| الرمز | المعنى |
|-------|--------|
| **1:N** | واحد إلى كثير |
| **N:1** | كثير إلى واحد |
| **1:1** | واحد إلى واحد (مع UQ) |
| **N:M** | كثير إلى كثير (جدول وسيط) |
| **0..1:1** | اختياري إلى واحد |

---

## التصحيحات الرئيسية عن النسخة السابقة

| # | الخطأ السابق | التصحيح |
|---|-------------|---------|
| 1 | `[المستخدم] —1— يدير —N— [الصالة]` لكل المستخدمين | **المدير فقط** يدير — `[المدير] —1— يدير —N— [الصالة]` |
| 2 | خلط «يدير» و«يعمل في» تحت كيان واحد | **موظف الصالة** (reception/maintenance/manager) — `users.station_id` |
| 3 | `[المستخدم] —N— ◇ —M— [البطولة]` مباشرة | العلاقة **عبر** `tournament_participants` فقط |
| 4 | `[المشارك] —N— ◇ —M— [المباراة]` | ثلاث علاقات **1:N** منفصلة: `player1_id`, `player2_id`, `winner_id` |
| 5 | طلب الانضمام ↔ الصالة = 1:1 | **N:1** — `hall_join_requests.station_id` nullable |
| 6 | إهمال `model_has_permissions` | إضافة علاقة N:M المستخدم ↔ الصلاحية |

---

## 1. تخصص المستخدم (User Specialization)

جدول `users` كيان **فيزيائي واحد**. الأدوار (Spatie) تحدد **التخصص المنطقي**:

| الدور | العلاقة بالصالة | FK |
|-------|-----------------|-----|
| **super_admin** | يدير المنصة (لا FK للصالة) | — |
| **manager** | يدير صالة/صالات | `stations.manager_id` |
| **manager / reception / maintenance** | يعمل في صالة | `users.station_id` |
| **customer** | يحجز ويُقيّم | `bookings.user_id`, `reviews.user_id`, … |

```
                    ┌─────────────┐
                    │  المستخدم   │
                    │   (users)   │
                    └──────┬──────┘
                           │ N:M
                           ▼
                    ┌─────────────┐
         ┌──────────│    الدور    │──────────┐
         │          │   (roles)   │          │
         ▼          └─────────────┘          ▼
   super_admin                          customer
   (المنصة)                          (حجز/تقييم)
         │
    manager ──1:N──► الصالة ◄──N:1── staff
   (يدير)                        (يعمل في)
```

---

## 2. علاقات المدير

| العلاقة | النوع | FK |
|---------|-------|-----|
| **المدير** يدير **الصالة** | **1:N** | `stations.manager_id` → `users.id` |

> مدير واحد قد يدير عدة صالات. كل صالة لها مدير واحد (nullable).

---

## 3. علاقات موظف الصالة

| العلاقة | النوع | FK |
|---------|-------|-----|
| **موظف الصالة** يعمل في **الصالة** | **N:1** | `users.station_id` → `stations.id` |
| **موظف** يتسلم **إشعار موظف** | **1:N** | `staff_notifications.user_id` |
| **موظف** يُبلّغ عن **عطل** | **1:N** | `device_faults.reported_by` |
| **موظف** ينشئ **بث / إيقاف / مصروف** | **1:N** | `created_by` |

---

## 4. علاقات العميل

| العلاقة | النوع | FK |
|---------|-------|-----|
| **العميل** ينفّذ **حجز** | **1:N** | `bookings.user_id` (nullable) |
| **العميل** يُقيّم **صالة / باقة** | **1:N** | `reviews`, `device_ratings` |
| **العميل** يكتب **تعليق** | **1:N** | `station_comments.user_id` |
| **العميل** يتسلم **إشعار عميل** | **1:N** | `customer_notifications.user_id` |
| **العميل** يدفع / ولاء | **1:N** | `payments`, `loyalty_point_transactions` |
| **العميل** يسجّل **مشارك بطولة** | **1:N** | `tournament_participants.user_id` |

---

## 5. علاقات البطولة (عبر جدول وسيط)

| العلاقة | النوع | FK |
|---------|-------|-----|
| **البطولة** تضم **مشارك** | **1:N** | `tournament_participants.tournament_id` |
| **المشارك** يلعب (player1) **مباراة** | **1:N** | `tournament_matches.player1_id` |
| **المشارك** يلعب (player2) **مباراة** | **1:N** | `tournament_matches.player2_id` |
| **المشارك** يفوز في **مباراة** | **1:N** | `tournament_matches.winner_id` |

> **UQ:** `(tournament_id, user_id)` — مشارك واحد لكل مستخدم في كل بطولة.

---

## 6. علاقات One To One

| الكيان A | الكيان B | FK |
|----------|----------|-----|
| **الحجز** | **الدفعة** | `payments.booking_id` UNIQUE |
| **عطل الجهاز** | **مصروف الصالة** | `hall_expenses.device_fault_id` UNIQUE (0..1) |

---

## 7. علاقات Many To Many

| الكيان A | الكيان B | الجدول الوسيط |
|----------|----------|---------------|
| **الصالة** | **الخدمة** | `service_station` |
| **المستخدم** | **الدور** | `model_has_roles` |
| **المستخدم** | **الصلاحية** | `model_has_permissions` |
| **الدور** | **الصلاحية** | `role_has_permissions` |

---

## 8. علاقات بدون FK (منطقية فقط)

| العلاقة | السبب |
|---------|-------|
| `bookings.offer_id` → `offers` | العمود موجود **بدون** Foreign Key |

---

## الملفات المرافقة

| الملف | الوصف |
|-------|--------|
| [entity-relationship-diagrams-v2.html](./entity-relationship-diagrams-v2.html) | مخططات Chen + ERD كامل (v2) |
| [relationships-data-v2.js](./relationships-data-v2.js) | بيانات العلاقات المصحّحة |
| [entity-relationship-diagrams.html](./entity-relationship-diagrams.html) | النسخة الأصلية (للمقارنة) |

---

*ZONES Platform — ERD v2 — مراجعة وفق مبادئ Chen وقاعدة البيانات الفعلية*
