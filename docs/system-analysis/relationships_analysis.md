# تحديد العلاقات بين الكيانات

## مقدمة

في هذا القسم يتم تحليل **العلاقات (Relationships)** بين كيانات نظام ZONES استناداً إلى:

- قيود المفاتيح الأجنبية (Foreign Keys) في migrations
- جداول الربط (Pivot Tables)
- علاقات Eloquent في نماذج Laravel

---

## أنواع العلاقات المستخدمة

| النوع | الرمز | الوصف |
|-------|-------|-------|
| One To One | 1:1 | كيان واحد يرتبط بكيان واحد فقط |
| One To Many | 1:N | كيان واحد يرتبط بعدة كيانات |
| Many To Many | N:M | عدة كيانات ترتبط بعدة كيانات عبر جدول وسيط |

---

## 1. علاقات المستخدم (User)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | المستخدم **يدير** صالة (كمدير) | **One To Many** | `stations.manager_id` → `users.id` (nullable, غير unique) |
| 2 | المستخدم **يعمل في** صالة (كموظف) | **Many To One** | `users.station_id` → `stations.id` (nullable) |
| 3 | المستخدم **ينفّذ** عدة حجوزات | **One To Many** | `bookings.user_id` → `users.id` |
| 4 | المستخدم **يملك** عدة رموز Push | **One To Many** | `device_tokens.user_id` → `users.id` CASCADE |
| 5 | المستخدم **يُقيّم** عدة صالات | **One To Many** | `reviews.user_id` → `users.id` |
| 6 | المستخدم **يكتب** عدة تعليقات | **One To Many** | `station_comments.user_id` → `users.id` CASCADE |
| 7 | المستخدم **يُقيّم** عدة باقات | **One To Many** | `device_ratings.user_id` → `users.id` CASCADE |
| 8 | المستخدم **يشارك في** عدة بطولات | **One To Many** | `tournament_participants.user_id` → `users.id` |
| 9 | المستخدم **يتلقى** عدة إشعارات عميل | **One To Many** | `customer_notifications.user_id` → `users.id` CASCADE |
| 10 | المستخدم **يتلقى** عدة إشعارات موظف | **One To Many** | `staff_notifications.user_id` → `users.id` CASCADE |
| 11 | المستخدم **لديه** عدة معاملات ولاء | **One To Many** | `loyalty_point_transactions.user_id` → `users.id` CASCADE |
| 12 | المستخدم **لديه** عدة معاملات دفع | **One To Many** | `payment_transactions.user_id` → `users.id` |
| 13 | المستخدم **يدفع** عدة دفعات | **One To Many** | `payments.user_id` → `users.id` |
| 14 | المستخدم **يُبلّغ عن** عدة أعطال | **One To Many** | `device_faults.reported_by` → `users.id` |
| 15 | المستخدم **ينشئ** عدة مصروفات | **One To Many** | `hall_expenses.created_by` → `users.id` |
| 16 | المستخدم **ينشئ** عدة تنبيهات | **One To Many** | `station_alerts.created_by` → `users.id` CASCADE |
| 17 | المستخدم **ينشئ** عدة إيقافات حجز | **One To Many** | `station_booking_stops.created_by` → `users.id` |
| 18 | المستخدم **يُدعى عبر** عدة دعوات | **One To Many** | `invitations.invited_by` → `users.id` CASCADE |
| 19 | المستخدم **يُربط بـ** عدة أدوار | **Many To Many** | عبر `model_has_roles` (Spatie) |
| 20 | المستخدم **يُمنح** عدة صلاحيات مباشرة | **Many To Many** | عبر `model_has_permissions` (Spatie) |

---

## 2. علاقات الصالة (Station)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | الصالة **تُدار بواسطة** مدير واحد | **Many To One** | `stations.manager_id` → `users.id` |
| 2 | الصالة **تحتوي على** عدة باقات | **One To Many** | `packages.station_id` → `stations.id` CASCADE |
| 3 | الصالة **تحتوي على** عدة أجهزة | **One To Many** | `devices.station_id` → `stations.id` CASCADE |
| 4 | الصالة **تستقبل** عدة حجوزات | **One To Many** | `bookings.station_id` → `stations.id` CASCADE |
| 5 | الصالة **تُقدّم** عدة عروض | **One To Many** | `offers.station_id` → `stations.id` NULL ON DELETE |
| 6 | الصالة **تستضيف** عدة بطولات | **One To Many** | `tournaments.station_id` → `stations.id` CASCADE |
| 7 | الصالة **تحصل على** عدة تقييمات | **One To Many** | `reviews.station_id` → `stations.id` CASCADE |
| 8 | الصالة **تحصل على** عدة تعليقات | **One To Many** | `station_comments.station_id` → `stations.id` CASCADE |
| 9 | الصالة **تُسجّل** عدة مصروفات | **One To Many** | `hall_expenses.station_id` → `stations.id` CASCADE |
| 10 | الصالة **تُسجّل** عدة أعطال | **One To Many** | `device_faults.station_id` → `stations.id` CASCADE |
| 11 | الصالة **تُوقف** الحجز عدة مرات | **One To Many** | `station_booking_stops.station_id` → `stations.id` CASCADE |
| 12 | الصالة **تُصدِر** عدة تنبيهات إدارية | **One To Many** | `station_alerts.station_id` → `stations.id` CASCADE |
| 13 | الصالة **ترتبط بـ** عدة خدمات | **Many To Many** | عبر `service_station` |
| 14 | الصالة **تُنشأ من** طلب انضمام | **One To One** | `hall_join_requests.station_id` → `stations.id` (nullable) |
| 15 | الصالة **تُربط بـ** عدة دعوات | **One To Many** | `invitations.station_id` → `stations.id` |
| 16 | الصالة **تُربط بـ** عدة إشعارات موظف | **One To Many** | `staff_notifications.station_id` → `stations.id` |

---

## 3. علاقات الباقة (Package)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | الباقة **تنتمي إلى** صالة واحدة | **Many To One** | `packages.station_id` → `stations.id` CASCADE |
| 2 | الباقة **تضم** عدة أجهزة | **One To Many** | `devices.package_id` → `packages.id` NULL ON DELETE |
| 3 | الباقة **تُستخدم في** عدة حجوزات | **One To Many** | `bookings.package_id` → `packages.id` CASCADE |
| 4 | الباقة **تُرتبط بـ** عدة عروض | **One To Many** | `offers.package_id` → `packages.id` NULL ON DELETE |
| 5 | الباقة **تُقيَّم من** عدة مستخدمين | **One To Many** | `device_ratings.package_id` → `packages.id` CASCADE |

> **قيود فريدة:** تقييم واحد لكل مستخدم لكل باقة — `UNIQUE(user_id, package_id)`.

---

## 4. علاقات الجهاز (Device)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | الجهاز **ينتمي إلى** صالة واحدة | **Many To One** | `devices.station_id` → `stations.id` CASCADE |
| 2 | الجهاز **ينتمي إلى** باقة واحدة | **Many To One** | `devices.package_id` → `packages.id` NULL ON DELETE |
| 3 | الجهاز **يُستخدم في** عدة حجوزات | **One To Many** | `bookings.device_id` → `devices.id` NULL ON DELETE |
| 4 | الجهاز **يُسجّل** عدة أعطال | **One To Many** | `device_faults.device_id` → `devices.id` CASCADE |

> **قيود فريدة:** `UNIQUE(station_id, device_code)` — رمز الجهاز فريد داخل الصالة.

---

## 5. علاقات الحجز (Booking)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | الحجز **ينتمي إلى** مستخدم (اختياري) | **Many To One** | `bookings.user_id` → `users.id` NULL ON DELETE |
| 2 | الحجز **ينتمي إلى** صالة | **Many To One** | `bookings.station_id` → `stations.id` CASCADE |
| 3 | الحجز **يُخصّص** جهازاً (اختياري) | **Many To One** | `bookings.device_id` → `devices.id` NULL ON DELETE |
| 4 | الحجز **يُخصّص** باقة | **Many To One** | `bookings.package_id` → `packages.id` CASCADE |
| 5 | الحجز **يُطبّق** عرضاً (اختياري) | **Many To One** | `bookings.offer_id` → `offers.id` *(بدون FK في DB)* |
| 6 | الحجز **له** دفعة واحدة | **One To One** | `payments.booking_id` → `bookings.id` UNIQUE CASCADE |
| 7 | الحجز **له** عدة معاملات دفع إلكتروني | **One To Many** | `payment_transactions.booking_id` → `bookings.id` |
| 8 | الحجز **يُولّد** عدة معاملات ولاء | **One To Many** | `loyalty_point_transactions.booking_id` → `bookings.id` |

> **ملاحظة:** `booking_number` فريد (UQ) — رقم مرجعي للحجز.

---

## 6. علاقات العرض (Offer)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | العرض **ينتمي إلى** صالة | **Many To One** | `offers.station_id` → `stations.id` |
| 2 | العرض **يرتبط بـ** باقة | **Many To One** | `offers.package_id` → `packages.id` |
| 3 | العرض **يحتوي على** عدة فترات زمنية | **One To Many** | `offer_time_slots.offer_id` → `offers.id` CASCADE |
| 4 | العرض **يُطبّق على** عدة حجوزات | **One To Many** | `bookings.offer_id` (منطقي — Offer::bookings()) |

---

## 7. علاقات البطولة (Tournament)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | البطولة **تُنظم في** صالة | **Many To One** | `tournaments.station_id` → `stations.id` CASCADE |
| 2 | البطولة **تضم** عدة مشاركين | **One To Many** | `tournament_participants.tournament_id` → `tournaments.id` CASCADE |
| 3 | البطولة **تتضمن** عدة مباريات | **One To Many** | `tournament_matches.tournament_id` → `tournaments.id` CASCADE |

> **قيود فريدة:** مشارك واحد لكل مستخدم في كل بطولة — `UNIQUE(tournament_id, user_id)`.

---

## 8. علاقات مشارك البطولة (TournamentParticipant)

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | المشارك **ينتمي إلى** بطولة | **Many To One** | `tournament_participants.tournament_id` → `tournaments.id` |
| 2 | المشارك **يرتبط بـ** مستخدم (اختياري) | **Many To One** | `tournament_participants.user_id` → `users.id` |
| 3 | المشارك **يلعب** كـ player1 في مباريات | **One To Many** | `tournament_matches.player1_id` → `tournament_participants.id` |
| 4 | المشارك **يلعب** كـ player2 في مباريات | **One To Many** | `tournament_matches.player2_id` → `tournament_participants.id` |
| 5 | المشارك **يفوز** في مباريات | **One To Many** | `tournament_matches.winner_id` → `tournament_participants.id` |

---

## 9. علاقات التقييم والتعليق

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | تقييم الصالة **ينتمي إلى** صالة | **Many To One** | `reviews.station_id` → `stations.id` |
| 2 | تقييم الصالة **ينتمي إلى** مستخدم | **Many To One** | `reviews.user_id` → `users.id` |
| 3 | تعليق الصالة **ينتمي إلى** صالة | **Many To One** | `station_comments.station_id` → `stations.id` |
| 4 | تعليق الصالة **ينتمي إلى** مستخدم | **Many To One** | `station_comments.user_id` → `users.id` |
| 5 | تعليق الصالة **له** تعليق أب (رد) | **Many To One (Self)** | `station_comments.parent_id` → `station_comments.id` CASCADE |
| 6 | تعليق الصالة **له** عدة ردود | **One To Many (Self)** | `StationComment::replies()` |
| 7 | تقييم الباقة **ينتمي إلى** مستخدم وباقة | **Many To One × 2** | `device_ratings.user_id`, `device_ratings.package_id` |

> **قيود فريدة:** تقييم واحد لكل مستخدم/صالة/فئة — `UNIQUE(user_id, station_id, category)`.

---

## 10. علاقات الصيانة والمالية

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | عطل الجهاز **ينتمي إلى** صالة وجهاز | **Many To One × 2** | `device_faults.station_id`, `device_faults.device_id` |
| 2 | عطل الجهاز **يُبلّغ عنه بواسطة** مستخدم | **Many To One** | `device_faults.reported_by` → `users.id` |
| 3 | مصروف الصالة **يرتبط بـ** عطل واحد (اختياري) | **One To One** | `hall_expenses.device_fault_id` → `device_faults.id` UNIQUE |
| 4 | مصروف الصالة **ينتمي إلى** صالة | **Many To One** | `hall_expenses.station_id` → `stations.id` CASCADE |
| 5 | مصروف الصالة **يُنشأ بواسطة** مستخدم | **Many To One** | `hall_expenses.created_by` → `users.id` |

---

## 11. علاقات الإشعارات والبث

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | التنبيه **ينتمي إلى** صالة | **Many To One** | `station_alerts.station_id` → `stations.id` CASCADE |
| 2 | التنبيه **يُنشئ** عدة إشعارات موظف | **One To Many** | `staff_notifications.station_alert_id` → `station_alerts.id` CASCADE |
| 3 | إشعار الموظف **يُوجَّه إلى** مستخدم | **Many To One** | `staff_notifications.user_id` → `users.id` CASCADE |
| 4 | إشعار العميل **يُوجَّه إلى** مستخدم | **Many To One** | `customer_notifications.user_id` → `users.id` CASCADE |

---

## 12. علاقات الانضمام والدعوات

| # | العلاقة | النوع | التفاصيل التقنية |
|---|---------|-------|------------------|
| 1 | طلب الانضمام **يرتبط بـ** صالة (عند القبول) | **Many To One** | `hall_join_requests.station_id` → `stations.id` |
| 2 | الدعوة **ترتبط بـ** طلب انضمام | **Many To One** | `invitations.hall_join_request_id` → `hall_join_requests.id` |
| 3 | الدعوة **ترتبط بـ** صالة | **Many To One** | `invitations.station_id` → `stations.id` |
| 4 | الدعوة **يُرسلها** مستخدم (أدمن) | **Many To One** | `invitations.invited_by` → `users.id` CASCADE |

---

## 13. علاقات Many To Many

| # | الكيان A | الكيان B | الجدول الوسيط | القيد |
|---|----------|----------|---------------|-------|
| 1 | **الصالة** | **الخدمة** | `service_station` | UQ(station_id, service_id) |
| 2 | **المستخدم** | **الدور** | `model_has_roles` | PK(role_id, model_id, model_type) |
| 3 | **المستخدم** | **الصلاحية** | `model_has_permissions` | PK(permission_id, model_id, model_type) |
| 4 | **الدور** | **الصلاحية** | `role_has_permissions` | PK(permission_id, role_id) |

---

## 14. علاقات One To One

| # | الكيان A | الكيان B | التفاصيل |
|---|----------|----------|----------|
| 1 | **الحجز** | **الدفعة** | `payments.booking_id` UNIQUE → `bookings.id` |
| 2 | **عطل الجهاز** | **مصروف الصالة** | `hall_expenses.device_fault_id` UNIQUE → `device_faults.id` (اختياري) |
| 3 | **المستخدم (مدير)** | **الصالات المُدارة** | `stations.manager_id` → `users.id` (1:N — غير مقيد unique) |
| 4 | **طلب الانضمام (مقبول)** | **الصالة** | `hall_join_requests.station_id` (N:1) |

---

## 15. علاقات Self-Reference (مرجع ذاتي)

| # | الكيان | العلاقة | التفاصيل |
|---|--------|---------|----------|
| 1 | **تعليق الصالة** | تعليق ← ردود | `station_comments.parent_id` → `station_comments.id` |

---

## 16. علاقات Spatie Permission (RBAC)

```
┌──────────┐     model_has_roles      ┌──────┐
│  User    │◄────────────────────────►│ Role │
└──────────┘                          └──┬───┘
       │                                 │
       │ model_has_permissions           │ role_has_permissions
       │                                 │
       ▼                                 ▼
┌──────────────┐                   ┌────────────┐
│ Permission   │◄──────────────────│ Permission │
└──────────────┘                   └────────────┘
```

| العلاقة | النوع |
|---------|-------|
| المستخدم ↔ الدور | Many To Many |
| المستخدم ↔ الصلاحية (مباشرة) | Many To Many |
| الدور ↔ الصلاحية | Many To Many |

---

## 17. ملخص Cardinality حسب الكيان المركزي

```
                              ┌─────────────┐
                              │   الصالة    │
                              └──────┬──────┘
         ┌─────────┬─────────┬───────┼───────┬─────────┬─────────┐
         │ 1:N     │ 1:N     │ 1:N   │ 1:N   │ 1:N     │ N:M     │
         ▼         ▼         ▼       ▼       ▼         ▼
      الباقة    الجهاز    الحجز  البطولة  العرض    الخدمة
         │ 1:N     │ 1:N     │ 1:1   │ 1:N     │ 1:N
         ▼         ▼         ▼       ▼         ▼
      الجهاز    عطل      الدفعة  مشارك   فترة عرض
                              │ 1:N
                              ▼
                          معاملة ولاء
```

---

## 18. علاقات بدون قيد FK (منطقية فقط)

| العلاقة | السبب |
|---------|-------|
| `bookings.offer_id` → `offers` | العمود موجود لكن **لا يوجد Foreign Key** في migration |
| `sessions.user_id` → `users` | مُفهرس فقط بدون FK |

---

## 19. قواعد الحذف (Delete Rules)

| القاعدة | أمثلة |
|---------|-------|
| **CASCADE** | حذف صالة → حذف باقاتها، أجهزتها، حجوزاتها |
| **NULL ON DELETE** | حذف مستخدم → `bookings.user_id` يصبح NULL |
| **SET NULL** | حذف مدير → `stations.manager_id` يصبح NULL |
| **Soft Delete** | users, stations, devices, packages, offers, tournaments |

---

*المستند: تحليل العلاقات — منصة ZONES*  
*المصدر: Foreign Keys + Eloquent Models — Laravel Backend*
