# توثيق تحليل وتصميم نظام ZONES

## System Analysis & Design Documentation (SAD/SRS)

هذا المجلد يحتوي على **تحليل هندسي أكاديمي** لكيانات نظام ZONES، مستخرج بالكامل من:

- `zones-backend-laravel/database/migrations/` (54 ملف)
- `zones-backend-laravel/app/Models/` (27 نموذج)

---

## الملفات

| الملف | المحتوى |
|-------|---------|
| [entities_analysis.md](./entities_analysis.md) | **تحديد كيانات النظام** — قائمة مرقمة وتصنيف الكيانات |
| [entities_attributes.md](./entities_attributes.md) | **تحديد خصائص كيانات النظام** — مخططات Attributes لكل كيان |
| [entity_attribute_diagrams.md](./entity_attribute_diagrams.md) | **رسم Chen Style** — خصائص كل كيان (مثل المثال الأكاديمي) |
| [entity-attribute-diagrams.html](./entity-attribute-diagrams.html) | **معاينة مرئية** — 31 مخطط SVG |
| [relationships_analysis.md](./relationships_analysis.md) | **تحديد العلاقات بين الكيانات** — One-to-One, One-to-Many, Many-to-Many |
| [erd_documentation.md](./erd_documentation.md) | **مخطط ERD الكامل** — Mermaid + ASCII diagrams |
| [zones-erd-report.html](./zones-erd-report.html) | **مخططات ERD مرئية** — تقرير HTML للمعاينة والطباعة |
| [EXPORT_PDF.md](./EXPORT_PDF.md) | **تحويل إلى PDF** — `npm run pdf` |

### تصدير PDF سريع

```powershell
cd docs\system-analysis
npm run pdf
```

ينشئ: `zones-erd-diagrams.pdf`

### مخططات خصائص الكيانات (Chen Style)

```powershell
npm run pdf:attributes
```

ينشئ: `zones-entity-attributes.pdf`

---

## ملخص سريع

| المؤشر | القيمة |
|--------|--------|
| إجمالي الجداول | 42 |
| كيانات الأعمال | 28 |
| الكيان المركزي | الصالة (`stations`) |
| جداول الربط | 4 |
| نماذج Laravel | 27 |

---

## منهجية التحليل

1. تحليل migrations واستخراج المخطط الموحّد
2. تحليل Models وعلاقات Eloquent
3. استخراج Foreign Keys و Pivot Tables
4. توثيق الخصائص والعلاقات
5. إنشاء مخططات ERD أكاديمية

---

*يونيو 2026 — مرحلة التحليل والتوثيق (بدون تنفيذ برمجي)*
