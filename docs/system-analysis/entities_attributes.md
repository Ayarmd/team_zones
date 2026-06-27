# تحديد خصائص كيانات النظام

## مقدمة

بعد تحديد الكيانات الأساسية، يتم في هذا الجزء تعريف **الخصائص (Attributes)** أو البيانات التي يتكون منها كل كيان. جميع الخصائص المذكورة مستخرجة مباشرة من **مخطط قاعدة البيانات الفعلي** (migrations + models).

**رموز:**
- `(PK)` = المفتاح الأساسي
- `(FK)` = مفتاح أجنبي
- `(UQ)` = فريد (Unique)
- `(NULL)` = يقبل القيم الفارغة

---

## 1. المستخدم — `users`

```
                    ┌─────────────────────┐
                    │      المستخدم        │
                    │       (users)        │
                    └──────────┬──────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
  ○ id (PK)              ○ full_name              ○ phone (UQ, NULL)
       │                       │                       │
  ○ email (UQ)           ○ google_id (UQ, NULL) ○ profile_image (NULL)
       │                       │                       │
  ○ password             ○ account_status         ○ loyalty_points_balance
       │                       │                       │
  ○ station_id (FK, NULL) ○ work_shift (NULL)    ○ last_login_at (NULL)
       │                       │                       │
  ○ email_verified_at    ○ phone_verified_at      ○ remember_token (NULL)
       │                       │                       │
  ○ deleted_at (NULL)    ○ created_at             ○ updated_at
       └───────────────────────┴───────────────────────┘
```

| الخاصية | النوع | Nullable | القيمة الافتراضية | ملاحظات |
|---------|-------|----------|-------------------|---------|
| `id` | bigint | لا | auto | PK |
| `full_name` | string | لا | — | الاسم الكامل |
| `phone` | string | نعم | — | UQ |
| `profile_image` | text | نعم | — | صورة الملف الشخصي |
| `email` | string | لا | — | UQ |
| `google_id` | string | نعم | — | UQ — تسجيل Google |
| `email_verified_at` | timestamp | نعم | — | |
| `phone_verified_at` | timestamp | نعم | — | |
| `password` | string | لا | — | مشفّر |
| `remember_token` | string | نعم | — | |
| `account_status` | enum | لا | `active` | active, inactive, suspended, blocked |
| `loyalty_points_balance` | unsigned int | لا | `0` | رصيد نقاط الولاء |
| `station_id` | bigint FK | نعم | — | → stations (موظف الصالة) |
| `work_shift` | string(20) | نعم | — | وردية العمل |
| `last_login_at` | timestamp | نعم | — | |
| `deleted_at` | timestamp | نعم | — | Soft Delete |
| `created_at`, `updated_at` | timestamps | — | — | |

---

## 2. الصالة — `stations`

```
                    ┌─────────────────────┐
                    │       الصالة         │
                    │      (stations)      │
                    └──────────┬──────────┘
                               │
  ○ id (PK)              ○ manager_id (FK, NULL)   ○ name
       │                       │                       │
  ○ slug (UQ)            ○ cover_image (NULL)     ○ phone (NULL)
       │                       │                       │
  ○ email (NULL)         ○ city                   ○ address (NULL)
       │                       │                       │
  ○ map_link (NULL)      ○ description (NULL)     ○ available_services (JSON)
       │                       │                       │
  ○ latitude (NULL)      ○ longitude (NULL)       ○ working_days (JSON)
       │                       │                       │
  ○ opens_at (NULL)      ○ closes_at (NULL)       ○ average_rating
       │                       │                       │
  ○ reviews_count        ○ is_active              ○ bookings_enabled
       │                       │                       │
  ○ is_published         ○ published_at (NULL)    ○ setup_completed_at (NULL)
       │                       │                       │
  ○ deleted_at (NULL)    ○ created_at             ○ updated_at
       └───────────────────────┴───────────────────────┘
```

| الخاصية | النوع | Nullable | الافتراضي |
|---------|-------|----------|-----------|
| `id` | bigint | لا | PK |
| `manager_id` | bigint FK | نعم | → users |
| `name` | string | لا | — |
| `slug` | string | لا | UQ |
| `cover_image` | string | نعم | — |
| `phone`, `email` | string | نعم | — |
| `city` | string | لا | `Tripoli` |
| `address` | string | نعم | — |
| `map_link` | string(500) | نعم | — |
| `description` | text | نعم | — |
| `available_services` | json | نعم | — |
| `latitude`, `longitude` | decimal(10,7) | نعم | — |
| `working_days` | json | نعم | — |
| `opens_at`, `closes_at` | time | نعم | — |
| `average_rating` | decimal(3,2) | لا | `0` |
| `reviews_count` | unsigned int | لا | `0` |
| `is_active` | boolean | لا | `true` |
| `bookings_enabled` | boolean | لا | `true` |
| `is_published` | boolean | لا | `false` |
| `published_at` | timestamp | نعم | — |
| `setup_completed_at` | timestamp | نعم | — |
| `deleted_at` | timestamp | نعم | Soft Delete |

---

## 3. الخدمة — `services`

```
        ┌─────────────────┐
        │     الخدمة       │
        │   (services)    │
        └────────┬────────┘
                 │
    ○ id (PK) ───┼─── ○ name
                 │
    ○ slug (UQ) ─┼─── ○ icon (NULL)
                 │
    ○ is_active ─┼─── ○ created_at / updated_at
                 └───────────────────────────────
```

| الخاصية | النوع | Nullable | الافتراضي |
|---------|-------|----------|-----------|
| `id` | bigint | لا | PK |
| `name` | string | لا | — |
| `slug` | string | لا | UQ |
| `icon` | string | نعم | — |
| `is_active` | boolean | لا | `true` |

---

## 4. الباقة — `packages`

```
        ┌─────────────────┐
        │      الباقة      │
        │   (packages)    │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ name ────────┼──── ○ slug (UQ)
                 │
  ○ package_type ┼──── ○ hourly_price
                 │
  ○ minimum_hours┼──── ○ maximum_hours
                 │
  ○ description ─┼──── ○ thumbnail (NULL)
                 │
  ○ is_active ───┼──── ○ average_rating / ratings_count
                 │
  ○ notes (NULL) ┼──── ○ deleted_at (NULL)
                 └───────────────────────────────
```

| الخاصية | النوع | Nullable | الافتراضي |
|---------|-------|----------|-----------|
| `id` | bigint | لا | PK |
| `station_id` | bigint FK | لا | → stations CASCADE |
| `name` | string | لا | — |
| `slug` | string | لا | UQ |
| `package_type` | enum | لا | ps5, pc, vr, xbox, simulator, vip |
| `hourly_price` | decimal(8,2) | لا | — |
| `minimum_hours` | integer | لا | `1` |
| `maximum_hours` | integer | لا | `3` |
| `description` | text | نعم | — |
| `thumbnail` | string | نعم | — |
| `is_active` | boolean | لا | `true` |
| `average_rating` | decimal(3,2) | لا | `0` |
| `ratings_count` | integer | لا | `0` |
| `notes` | text | نعم | — |
| `deleted_at` | timestamp | نعم | Soft Delete |

---

## 5. الجهاز — `devices`

```
        ┌─────────────────┐
        │      الجهاز      │
        │    (devices)    │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ package_id ──┼──── ○ device_code (UQ per station)
       (FK,NULL) │
  ○ display_name ┼──── ○ device_type
                 │
  ○ operational_status ── ○ average_rating / ratings_count
                 │
  ○ notes (NULL) ┼──── ○ last_maintenance_at (NULL)
                 │
  ○ deleted_at ──┼──── ○ created_at / updated_at
                 └───────────────────────────────
```

| الخاصية | النوع | Nullable | الافتراضي |
|---------|-------|----------|-----------|
| `id` | bigint | لا | PK |
| `station_id` | bigint FK | لا | → stations CASCADE |
| `package_id` | bigint FK | نعم | → packages NULL ON DELETE |
| `device_code` | string | لا | UQ(station_id, device_code) |
| `display_name` | string | لا | — |
| `device_type` | enum | لا | ps5, pc, vr, xbox, simulator, vip |
| `operational_status` | enum | لا | `active` — active, maintenance, inactive |
| `average_rating` | decimal(3,2) | لا | `0` |
| `ratings_count` | integer | لا | `0` |
| `notes` | text | نعم | — |
| `last_maintenance_at` | timestamp | نعم | — |
| `deleted_at` | timestamp | نعم | Soft Delete |

---

## 6. الحجز — `bookings`

```
                    ┌─────────────────────┐
                    │        الحجز         │
                    │      (bookings)      │
                    └──────────┬──────────┘
                               │
  ○ id (PK)              ○ user_id (FK, NULL)     ○ station_id (FK)
       │                       │                       │
  ○ device_id (FK, NULL) ○ package_id (FK)      ○ offer_id (NULL, no FK)
       │                       │                       │
  ○ booking_number (UQ)  ○ booking_type           ○ visitor_name/phone/email
       │                       │                       │
  ○ start_date/end_date  ○ start_time/end_time    ○ hours_count
       │                       │                       │
  ○ original_hourly_price ○ discounted_hourly_price ○ discount_amount/percent
       │                       │                       │
  ○ loyalty_coupon_*     ○ loyalty_points_*       ○ subtotal_price
       │                       │                       │
  ○ platform_commission_* ○ total_price           ○ payment_method
       │                       │                       │
  ○ payment_status       ○ booking_status         ○ needs_refund_review
       │                       │                       │
  ○ session_status       ○ is_checked_in          ○ checked_in_at
       │                       │                       │
  ○ session_started_at   ○ session_ended_at       ○ session_duration_seconds
       │                       │                       │
  ○ receipt_pdf_path     ○ ticket_pdf_path        ○ receipt_image_path
       │                       │                       │
  ○ qr_code (NULL)       ○ booking_source         ○ notes (NULL)
       └───────────────────────┴───────────────────────┘
```

| مجموعة | الخصائص الرئيسية |
|--------|------------------|
| **الربط** | `user_id`, `station_id`, `device_id`, `package_id`, `offer_id` |
| **التعريف** | `booking_number` (UQ), `booking_type` (regular, offer, loyalty) |
| **الزائر** | `visitor_name`, `visitor_phone`, `visitor_email` |
| **الجدولة** | `start_date`, `end_date`, `start_time`, `end_time`, `hours_count` |
| **التسعير** | `original_hourly_price`, `discounted_hourly_price`, `discount_amount`, `discount_percent`, `subtotal_price`, `platform_commission_amount`, `platform_commission_rate`, `total_price` |
| **الولاء** | `loyalty_coupon_label`, `loyalty_coupon_code`, `loyalty_points_per_session`, `loyalty_points_total`, `loyalty_points_awarded_at`, `loyalty_points_redeemed` |
| **الدفع** | `payment_method` (cash, online, loyalty_reward), `payment_status` (pending, paid, failed, refunded) |
| **الحالة** | `booking_status` (pending, confirmed, cancelled, cancelled_maintenance, completed, expired) |
| **الجلسة** | `session_status` (waiting, checked_in, playing, finished, no_show), `is_checked_in`, `checked_in_at`, `session_started_at`, `session_ended_at`, `session_duration_seconds` |
| **المستندات** | `receipt_pdf_path`, `ticket_pdf_path`, `receipt_image_path`, `qr_code` |
| **أخرى** | `booking_source`, `notes`, `cancelled_at`, `needs_refund_review` |

---

## 7. العرض — `offers`

```
        ┌─────────────────┐
        │      العرض       │
        │    (offers)     │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK, NULL)
                 │
  ○ package_id ──┼──── ○ title
       (FK,NULL) │
  ○ offer_image ─┼──── ○ description
                 │
  ○ valid_from ──┼──── ○ expires_at
                 │
  ○ original_price ── ○ discounted_price ── ○ discount_percent
                 │
  ○ terms (JSON) ┼──── ○ is_active
                 │
  ○ deleted_at ──┼──── ○ created_at / updated_at
                 └───────────────────────────────
```

---

## 8. فترة العرض — `offer_time_slots`

```
        ┌─────────────────────┐
        │    فترة العرض        │
        │ (offer_time_slots)  │
        └──────────┬──────────┘
                   │
      ○ id (PK) ───┼─── ○ offer_id (FK)
                   │
      ○ time_range ┼─── ○ is_available
                   │
      ○ created_at / updated_at
                   └───────────────────────────────
```

---

## 9. البطولة — `tournaments`

```
        ┌─────────────────┐
        │     البطولة      │
        │  (tournaments)  │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ title ───────┼──── ○ game_name / game_emoji
                 │
  ○ cover_image ─┼──── ○ start_date / end_date
                 │
  ○ registration_deadline ── ○ prize_summary
                 │
  ○ entry_fee ───┼──── ○ match_rules
                 │
  ○ delay_minutes┼──── ○ withdrawal_rule (NULL)
                 │
  ○ status ──────┼──── ○ max_participants / is_active
                 │
  ○ deleted_at ──┼──── ○ created_at / updated_at
                 └───────────────────────────────
```

| `status` | upcoming, ongoing, completed, cancelled |

---

## 10. مشارك البطولة — `tournament_participants`

```
        ┌─────────────────────────┐
        │    مشارك البطولة        │
        │(tournament_participants)│
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ tournament_id (FK)
                     │
  ○ user_id (FK,NULL)┼──── ○ name
                     │
  ○ avatar_url (NULL)┼──── ○ status
                     │
  ○ registered_at ───┼──── ○ withdrawn_at (NULL)
                     │
  UQ(tournament_id, user_id)
                     └───────────────────────────────
```

---

## 11. مباراة البطولة — `tournament_matches`

```
        ┌─────────────────────────┐
        │    مباراة البطولة       │
        │  (tournament_matches)   │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ tournament_id (FK)
                     │
  ○ round_index ─────┼──── ○ match_index
                     │
  ○ round (varchar) ─┼──── ○ player1_id / player2_id (FK → participants)
                     │
  ○ score1 / score2 ─┼──── ○ scheduled_at (NULL)
                     │
  ○ status ──────────┼──── ○ winner_id (FK → participants, NULL)
                     └───────────────────────────────
```

| `status` | upcoming, live, completed |

---

## 12. تقييم الصالة — `reviews`

```
        ┌─────────────────┐
        │  تقييم الصالة    │
        │   (reviews)     │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ user_id ─────┼──── ○ category
       (FK,NULL) │     (general, ps5, pc, vr, xbox)
  ○ stars ───────┼──── ○ created_at / updated_at
                 │
  UQ(user_id, station_id, category)
                 └───────────────────────────────
```

---

## 13. تعليق الصالة — `station_comments`

```
        ┌─────────────────────┐
        │   تعليق الصالة       │
        │ (station_comments)  │
        └──────────┬──────────┘
                   │
  ○ id (PK) ───────┼──── ○ station_id (FK)
                   │
  ○ user_id (FK) ──┼──── ○ parent_id (FK → self, NULL)
                   │
  ○ body ──────────┼──── ○ edited_at (NULL)
                   │
  ○ created_at / updated_at
                   └───────────────────────────────
```

---

## 14. تقييم الباقة — `device_ratings`

```
        ┌─────────────────────┐
        │   تقييم الباقة       │
        │  (device_ratings)   │
        └──────────┬──────────┘
                   │
  ○ id (PK) ───────┼──── ○ user_id (FK)
                   │
  ○ package_id ────┼──── ○ rating_value
                   │
  UQ(user_id, package_id)
                   └───────────────────────────────
```

---

## 15. عطل الجهاز — `device_faults`

```
        ┌─────────────────┐
        │   عطل الجهاز     │
        │ (device_faults) │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ device_id ───┼──── ○ reported_by (FK → users, NULL)
                 │
  ○ fault_type ──┼──── ○ fault_type_custom (NULL)
                 │
  ○ details ─────┼──── ○ status (pending, in_progress, resolved)
                 │
  ○ maintenance_cost ── ○ maintenance_employee_name (NULL)
                 │
  ○ reported_at ─┼──── ○ resolved_at (NULL)
                 │
  ○ archived ────┼──── ○ created_at / updated_at
                 └───────────────────────────────
```

---

## 16. مصروف الصالة — `hall_expenses`

```
        ┌─────────────────┐
        │  مصروف الصالة    │
        │ (hall_expenses) │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ station_id (FK)
                 │
  ○ name ────────┼──── ○ amount
                 │
  ○ is_paid ─────┼──── ○ added_at / paid_at (NULL)
                 │
  ○ notes ───────┼──── ○ category (NULL)
                 │
  ○ device_fault_id (FK, UQ, NULL) ── ○ created_by (FK → users, NULL)
                 └───────────────────────────────
```

---

## 17. إيقاف الحجز — `station_booking_stops`

```
        ┌─────────────────────────┐
        │     إيقاف الحجز          │
        │(station_booking_stops)  │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ station_id (FK)
                     │
  ○ reason_key ──────┼──── ○ starts_on / ends_on (NULL)
                     │
  ○ status ──────────┼──── ○ created_by (FK, NULL)
                     │
  ○ ended_at (NULL) ─┼──── ○ created_at / updated_at
                     └───────────────────────────────
```

---

## 18. تنبيهات الصالة — `station_alerts`

```
        ┌─────────────────────────┐
        │     تنبيهات الصالة       │
        │    (station_alerts)     │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ station_id (FK)
                     │
  ○ created_by (FK) ─┼──── ○ name / body
                     │
  ○ target_audience ─┼──── ○ severity / status
                     │
  ○ alternative_instructions (NULL)
                     │
  ○ starts_at / ends_at (NULL)
                     └───────────────────────────────
```

---

## 19. إشعار الموظف — `staff_notifications`

```
        ┌─────────────────────────┐
        │    إشعار الموظف          │
        │ (staff_notifications)   │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ user_id (FK)
                     │
  ○ station_id ──────┼──── ○ station_alert_id (FK, NULL)
                     │
  ○ type / title / body ── ○ payload (JSON, NULL)
                     │
  ○ read_at (NULL) ──┼──── ○ created_at / updated_at
                     └───────────────────────────────
```

---

## 20. إشعار العميل — `customer_notifications`

```
        ┌─────────────────────────┐
        │    إشعار العميل          │
        │(customer_notifications) │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ user_id (FK)
                     │
  ○ type / title / body ── ○ payload (JSON, NULL)
                     │
  ○ read_at (NULL) ──┼──── ○ created_at / updated_at
                     └───────────────────────────────
```

---

## 21. الدفعة — `payments`

```
        ┌─────────────────┐
        │     الدفعة       │
        │   (payments)    │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ booking_id (FK, UQ) — One To One
                 │
  ○ user_id ─────┼──── ○ amount
       (FK,NULL) │
  ○ payment_method ── ○ transaction_ref (NULL)
                 │
  ○ status ──────┼──── ○ paid_at
                 └───────────────────────────────
```

| `payment_method` | electronic, pay_on_arrival |
| `status` | completed, refunded |

---

## 22. معاملة الدفع — `payment_transactions`

```
        ┌─────────────────────────┐
        │  معاملة الدفع الإلكتروني  │
        │ (payment_transactions)  │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ invoice_no (UQ)
                     │
  ○ user_id ─────────┼──── ○ booking_id (FK, NULL)
                     │
  ○ amount / currency┼──── ○ gateway
                     │
  ○ status ──────────┼──── ○ redirect_url (NULL)
                     │
  ○ callback_payload ┼──── ○ paid_at (NULL)
                     └───────────────────────────────
```

---

## 23. معاملة نقاط الولاء — `loyalty_point_transactions`

```
        ┌─────────────────────────────┐
        │  معاملة نقاط الولاء         │
        │(loyalty_point_transactions)│
        └──────────────┬──────────────┘
                       │
  ○ id (PK) ───────────┼──── ○ user_id (FK)
                       │
  ○ booking_id ────────┼──── ○ type (earn / redeem)
         (FK, NULL)    │
  ○ points ────────────┼──── ○ balance_after
                       │
  ○ note (NULL) ───────┼──── ○ created_at / updated_at
                       └───────────────────────────────
```

---

## 24. إعدادات المنصة — `platform_settings`

```
        ┌─────────────────────────┐
        │    إعدادات المنصة        │
        │  (platform_settings)    │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ loyalty_points_per_session
                     │
  ○ loyalty_minimum_points_required
                     │
  ○ platform_commission_rate
                     │
  ○ platform_name (NULL) ── ○ platform_logo_path (NULL)
                     │
  ○ created_at / updated_at
                     └───────────────────────────────
```

> **نمط Singleton:** سجل واحد (id=1) يُنشأ تلقائياً عبر `PlatformSetting::current()`.

---

## 25. طلب انضمام صالة — `hall_join_requests`

```
        ┌─────────────────────────┐
        │   طلب انضمام صالة       │
        │  (hall_join_requests)   │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ hall_name / address / city
                     │
  ○ map_link ────────┼──── ○ manager_email / manager_name
                     │
  ○ commercial_phone ┼──── ○ images (JSON, NULL)
                     │
  ○ status ──────────┼──── ○ commission_rate (NULL)
                     │
  ○ admin_notes ─────┼──── ○ rejection_reason (NULL)
                     │
  ○ station_id ──────┼──── ○ accepted_at / rejected_at
       (FK, NULL)    │
                     └───────────────────────────────
```

| `status` | pending, accepted, rejected |

---

## 26. الدعوة — `invitations`

```
        ┌─────────────────┐
        │     الدعوة       │
        │  (invitations)  │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ name / station_name / email
                 │
  ○ role / shift ┼──── ○ token (UQ)
                 │
  ○ invited_by ──┼──── ○ hall_join_request_id (FK, NULL)
       (FK)      │
  ○ station_id ──┼──── ○ expires_at / used_at (NULL)
       (FK,NULL) │
                 └───────────────────────────────
```

---

## 27. رمز إعادة التعيين — `password_reset_codes`

```
        ┌─────────────────────────┐
        │ رمز إعادة تعيين كلمة المرور │
        │ (password_reset_codes)  │
        └────────────┬────────────┘
                     │
  ○ id (PK) ─────────┼──── ○ email (indexed)
                     │
  ○ code (6 chars) ──┼──── ○ expires_at
                     │
  ○ used_at (NULL) ──┼──── ○ created_at / updated_at
                     └───────────────────────────────
```

---

## 28. رمز جهاز Push — `device_tokens`

```
        ┌─────────────────┐
        │  رمز جهاز Push   │
        │ (device_tokens) │
        └────────┬────────┘
                 │
  ○ id (PK) ─────┼──── ○ user_id (FK)
                 │
  ○ token (UQ) ──┼──── ○ platform
                 │
  ○ last_used_at ┼──── ○ created_at / updated_at
                 └───────────────────────────────
```

---

## 29. ربط الصالة بالخدمة — `service_station`

```
        ┌─────────────────────┐
        │  ربط الصالة بالخدمة   │
        │  (service_station)  │
        └──────────┬──────────┘
                   │
  ○ id (PK) ───────┼──── ○ station_id (FK)
                   │
  ○ service_id ────┼──── ○ created_at / updated_at
                   │
  UQ(station_id, service_id)
                   └───────────────────────────────
```

---

*المستند: خصائص كيانات النظام — منصة ZONES*  
*المصدر: migrations + models — Laravel Backend*
