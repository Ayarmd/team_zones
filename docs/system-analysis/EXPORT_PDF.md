# Export PDF — مخططات ERD

## الطريقة 1: سكربت تلقائي (موصى به)

```powershell
cd docs\system-analysis
npm run pdf
```

**النتيجة:** `zones-erd-diagrams.pdf` — مخططات ERD والعلاقات فقط

```powershell
npm run pdf:attributes
```

**النتيجة:** `zones-entity-attributes.pdf` — **31 رسمة Chen** لخصائص كل كيان

```powershell
npm run pdf:all
```

**النتيجة:** `zones-system-analysis-full.pdf` — التقرير الكامل

> أول تشغيل يثبّت `puppeteer` تلقائياً.

---

## الطريقة 2: من المتصفح (بدون Node)

1. افتح `zones-erd-report.html` أو `entity-attribute-diagrams.html` في Chrome
2. `Ctrl + P` → **Save as PDF**
3. فعّل **Background graphics**
4. ERD: **A3 Landscape** · Attributes: **A3 Portrait**

---

## الملفات

| الملف | الوصف |
|-------|--------|
| `zones-erd-report.html` | تقرير HTML بمخططات Mermaid ERD واضحة |
| `entity-attribute-diagrams.html` | **31 رسمة Chen** — كيان + خصائص (مثل المثال) |
| `entity_attribute_diagrams.md` | مستند امتداد للخصائص |
| `entities-data.js` | بيانات الكيانات |
| `export-to-pdf.mjs` | سكربت تحويل HTML → PDF |
| `zones-erd-diagrams.pdf` | PDF علاقات ERD |
| `zones-entity-attributes.pdf` | PDF خصائص الكيانات |

---

## محتوى المخططات

1. النواة المركزية (صالة، باقة، جهاز، حجز)
2. الحجز والدفع والولاء
3. الصالة والخدمات (N:M)
4. البطولات
5. التقييم والتعليق
6. الصيانة والمصروفات
7. الإشعارات والبث
8. الانضمام والصلاحيات
9. Relationship Map كامل
10. جدول Cardinality
