# نشر ZONES — بدون بطاقة فيزا

دليل النشر المجاني للمشروع [team_zones](https://github.com/Ayarmd/team_zones).

## المنصات الموصى بها (بدون فيزا)

| المكوّن | المنصة | فيزا؟ | ملاحظة |
|---------|--------|-------|--------|
| **Laravel API** | **[Render](https://render.com)** | لا | الأفضل — Docker جاهز |
| **بديل API** | **[Railway](https://railway.com)** | لا للتسجيل | $5 تجريبي ثم $1/شهر رصيد |
| **MySQL** | **[Aiven Free](https://aiven.io/free-mysql-database)** | لا | خطة MySQL مجانية |
| **React** | **[Vercel](https://vercel.com)** | لا | Root: `zones_react` |

> **Koyeb** يطلب بطاقة فيزا — **لا نستخدمه**.

---

## الترتيب الصحيح

```
1. Aiven (MySQL مجاني)
2. Render أو Railway (Laravel API)
3. Vercel (React)
4. ربط CORS (APP_URL + FRONTEND_URL)
5. اختبار login + API
```

---

# المسار أ — Render + Aiven + Vercel (موصى به)

## 1) Aiven — MySQL مجاني

1. ادخل [console.aiven.io](https://console.aiven.io) → سجّل بـ **GitHub** (بدون فيزا).
2. **Create service** → **MySQL** → اختر **Free plan** (مو Trial المدفوع).
3. بعد **Running** → **Connection information**:
   - Host, Port, User, Password, Database
4. حمّل **CA certificate** (`ca.pem`).
5. فعّل **Public access** للخدمة.

احفظ القيم محلياً — راجع `deploy/aiven-mysql.env.example`.

---

## 2) Render — Laravel API

### طريقة أ: Blueprint (أسهل)

1. [dashboard.render.com](https://dashboard.render.com) → سجّل بـ GitHub (**بدون فيزا**).
2. **New** → **Blueprint** → اختر `Ayarmd/team_zones`.
3. Render يقرأ `render.yaml` من الجذر.
4. في **Environment** أضف القيم السرية من `deploy/render.env.example`:
   - `APP_KEY` — ولّده محلياً:
     ```powershell
     cd C:\Users\DELL\Desktop\team_zones\zones-backend-laravel
     php artisan key:generate --show
     ```
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - `MYSQL_ATTR_SSL_CA` — ارفع `ca.pem` كـ Secret File إن أمكن
5. **Create services** → انتظر البناء (5–15 دقيقة أول مرة).

### طريقة ب: يدوياً

1. **New** → **Web Service** → GitHub → `team_zones`.
2. **Root Directory:** `zones-backend-laravel`
3. **Language:** Docker
4. **Plan:** Free
5. **Health Check Path:** `/up`
6. أضف متغيرات البيئة كما فوق.

### بعد النشر

```
https://zones-api.onrender.com/up          → 200
https://zones-api.onrender.com/api/public/branding-settings
```

**قيود المجاني:** ينام بعد ~15 دقيقة خمول — أول طلب يأخذ 30–60 ثانية (cold start).

---

## 3) Vercel — React

1. [vercel.com](https://vercel.com) → **Add Project** → `Ayarmd/team_zones`.
2. **Root Directory:** `zones_react`
3. **Environment Variable:**
   ```
   VITE_API_BASE_URL=https://zones-api.onrender.com/api
   ```
   (أو رابط Render الفعلي)
4. **Deploy**.

---

## 4) ربط CORS (Render)

عدّل في Render → Environment:

```
APP_URL=https://zones-api.onrender.com
FRONTEND_URL=https://your-app.vercel.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app
```

**Manual Deploy** لإعادة التشغيل.

---

# المسار ب — Railway (API + MySQL معاً)

مناسب إذا تبي كل شيء في مكان واحد.

1. [railway.com](https://railway.com) → GitHub (**بدون فيزا**).
2. **New Project** → **Deploy from GitHub** → `team_zones`.
3. **خدمة Laravel:**
   - Root Directory: `zones-backend-laravel`
   - Builder: **Dockerfile**
   - أضف `APP_KEY` ومتغيرات أخرى من `deploy/railway.env.example`
4. **أضف MySQL:** Project → **+ New** → **Database** → **MySQL**.
5. في خدمة Laravel → **Variables** → **Connect** MySQL (يملأ `DB_*` تلقائياً).
6. **Networking** → **Generate Domain** → انسخ الرابط لـ `APP_URL`.
7. Vercel: `VITE_API_BASE_URL=https://YOUR.up.railway.app/api`

**الرصيد المجاني:** $5 أول شهر → ثم ~$1/شهر. API + MySQL قد يستهلك الرصيد بسرعة — راقب Usage.

---

# شهادة SSL لـ Aiven على Render

1. حمّل `ca.pem` من Aiven.
2. في Render → Service → **Secret Files** → mount أو انسخ المحتوى.
3. أو (مستودع private فقط): ضع الملف في `zones-backend-laravel/storage/aiven-ca.pem`.

بدون الشهادة، اتصال Aiven يفشل.

---

# ملفات الإعداد في المستودع

| الملف | الغرض |
|-------|--------|
| `render.yaml` | Blueprint لـ Render |
| `zones-backend-laravel/Dockerfile` | بناء Laravel |
| `zones-backend-laravel/railway.toml` | بديل Railway (Nixpacks) |
| `zones_react/vercel.json` | Vite على Vercel |
| `deploy/render.env.example` | متغيرات Render |
| `deploy/railway.env.example` | متغيرات Railway |
| `deploy/aiven-mysql.env.example` | اتصال Aiven |
| `deploy/vercel.env.example` | `VITE_API_BASE_URL` |

---

# Flutter (لاحقاً)

```bash
flutter build apk --dart-define=ZONEZ_PUBLIC_API_ROOT=https://zones-api.onrender.com
```

---

# استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Render build فشل | راجع Logs — غالباً Composer أو ذاكرة؛ أعد Deploy |
| 502 بعد نوم الخدمة | طبيعي على Free — انتظر 30–60 ثانية |
| DB connection refused | Aiven public access + SSL CA |
| CORS | `FRONTEND_URL` على Render |
| Vercel API غلط | Root = `zones_react` + `VITE_API_BASE_URL` |
| Railway نفد الرصيد | Services paused — انتظر الشهر أو استخدم Render |

---

# مقارنة سريعة

| | Render | Railway |
|---|--------|---------|
| فيزا للتسجيل | لا | لا |
| Laravel Docker | نعم | نعم |
| MySQL مدمج | لا (استخدم Aiven) | نعم |
| نوم بعد خمول | نعم (~15 دقيقة) | يتوقف إذا نفد الرصيد |
| الأنسب لـ ZONES | **API على Render + Aiven** | **كل شيء على Railway** |
