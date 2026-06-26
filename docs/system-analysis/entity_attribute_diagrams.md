# مخططات خصائص الكيانات — Chen Style

## مقدمة

هذا المستند **امتداد** لـ `entities_attributes.md` ويعرض **رسمة خصائص كل كيان** بأسلوب **Chen ERD** الأكاديمي:

- **مستطيل أزرق** في الوسط = الكيان (Entity / Table)
- **بيضاويات فاتحة** حوله = الخصائص (Attributes)
- **خطوط** تربط الكيان بكل خاصية
- **`id` مسطّر** = المفتاح الأساسي (PK)
- **`*`** بجانب الاسم = مفتاح أجنبي (FK)

جميع الخصائص **حقيقية** من Laravel migrations.

---

## المعاينة المرئية

افتح الملف التفاعلي:

**[`entity-attribute-diagrams.html`](./entity-attribute-diagrams.html)**

يحتوي على **31 مخططاً** — واحد لكل جدول/كيان في النظام.

---

## تصدير PDF

```powershell
cd docs\system-analysis
npm run pdf:attributes
```

**النتيجة:** `zones-entity-attributes.pdf`

**أو من Chrome:** افتح `entity-attribute-diagrams.html` → `Ctrl+P` → Save as PDF → A3 Portrait

---

## قائمة المخططات

| # | الكيان (عربي) | الجدول | عدد الخصائص |
|---|---------------|--------|-------------|
| 1 | المستخدم | `users` | 18 |
| 2 | الصالة | `stations` | 27 |
| 3 | الخدمة | `services` | 6 |
| 4 | الباقة | `packages` | 17 |
| 5 | الجهاز | `devices` | 14 |
| 6 | الحجز | `bookings` | 48 |
| 7 | العرض | `offers` | 16 |
| 8 | فترة العرض | `offer_time_slots` | 6 |
| 9 | البطولة | `tournaments` | 20 |
| 10 | مشارك البطولة | `tournament_participants` | 10 |
| 11 | مباراة البطولة | `tournament_matches` | 14 |
| 12 | تقييم الصالة | `reviews` | 7 |
| 13 | تعليق الصالة | `station_comments` | 8 |
| 14 | تقييم الباقة | `device_ratings` | 6 |
| 15 | عطل الجهاز | `device_faults` | 15 |
| 16 | مصروف الصالة | `hall_expenses` | 13 |
| 17 | إيقاف الحجز | `station_booking_stops` | 10 |
| 18 | البث الإداري | `station_broadcasts` | 13 |
| 19 | إشعار الموظف | `staff_notifications` | 11 |
| 20 | إشعار العميل | `customer_notifications` | 9 |
| 21 | الدفعة | `payments` | 10 |
| 22 | معاملة الدفع | `payment_transactions` | 13 |
| 23 | معاملة الولاء | `loyalty_point_transactions` | 8 |
| 24 | إعدادات المنصة | `platform_settings` | 8 |
| 25 | طلب انضمام | `hall_join_requests` | 18 |
| 26 | الدعوة | `invitations` | 14 |
| 27 | رمز إعادة التعيين | `password_reset_codes` | 7 |
| 28 | رمز Push | `device_tokens` | 7 |
| 29 | ربط صالة-خدمة | `service_station` | 5 |
| 30 | الدور | `roles` | 5 |
| 31 | الصلاحية | `permissions` | 5 |

---

## مثال — شكل المخطط

```
                    ○ created_at
                   /
        ○ phone ----●---- ○ email
                   |\
                   | ○ full_name
              ┌────┴────┐
              │  users  │
              └────┬────┘
                   |
        ○ station_id * ---- ○ account_status
                   |
              ○ id (PK)
```

> في الملف HTML/SVG: الكيان مستطيل أزرق والخصائص بيضاويات مثل المثال الأكاديمي المرجعي.

---

## الملفات المرتبطة

| الملف | الوصف |
|-------|--------|
| `entity-attribute-diagrams.html` | جميع الرسومات التفاعلية |
| `entities-data.js` | بيانات الكيانات (مصدر الرسم) |
| `entities_attributes.md` | الجداول التفصيلية للخصائص |
| `zones-entity-attributes.pdf` | PDF المُولَّد |

---

*منصة ZONES — System Analysis Documentation*
