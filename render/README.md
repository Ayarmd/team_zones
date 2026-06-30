# نشر Laravel API على Render

المستودع: https://github.com/jeje430/myzones

## الملفات

| الملف | الغرض |
|--------|--------|
| `/render.yaml` | Blueprint — ينشئ خدمة `zones-api` تلقائياً |
| `/zones-backend-laravel/Dockerfile` | بناء Docker (PHP 8.4 + MySQL + migrate) |
| `/zones-backend-laravel/docker/entrypoint.sh` | تشغيل migrate ثم `artisan serve` |
| `/deploy/render.env.example` | متغيرات البيئة للنسخ |
| `/deploy/aiven-mysql.env.example` | بيانات Aiven MySQL |

---

## قبل Render — جهّز Aiven

1. أنشئ MySQL مجاني على https://console.aiven.io
2. فعّل Public access
3. انسخ: Host, Port, User, Password, Database
4. حمّل `ca.pem` (شهادة SSL)

---

## الطريقة أ — Blueprint (أسهل)

1. https://dashboard.render.com → سجّل بـ GitHub
2. **New** → **Blueprint**
3. اختر مستودع **jeje430/myzones**
4. Render يقرأ `render.yaml` من الجذر
5. **Apply** → انتظر البناء (5–15 دقيقة أول مرة)

---

## الطريقة ب — يدوياً

1. **New** → **Web Service**
2. Repository: **jeje430/myzones**
3. **Root Directory:** `zones-backend-laravel`
4. **Language:** Docker
5. **Dockerfile Path:** `./Dockerfile`
6. **Plan:** Free
7. **Health Check Path:** `/up`

---

## متغيرات البيئة (Render → zones-api → Environment)

انسخ من `deploy/render.env.example` وعدّل:

```
APP_KEY=base64:...          ← php artisan key:generate --show
APP_URL=https://zones-api.onrender.com
FRONTEND_URL=https://myzones.vercel.app
CORS_ALLOWED_ORIGINS=https://myzones.vercel.app
SANCTUM_STATEFUL_DOMAINS=myzones.vercel.app

DB_HOST=mysql-xxxxx.a.aivencloud.com
DB_PORT=12345
DB_DATABASE=defaultdb
DB_USERNAME=avnadmin
DB_PASSWORD=...
MYSQL_ATTR_SSL_CA=/var/www/html/storage/aiven-ca.pem
```

### APP_KEY — ولّده محلياً

```powershell
cd zones-backend-laravel
php artisan key:generate --show
```

### شهادة Aiven SSL على Render

1. Render → Service → **Secret Files**
2. Mount path: `/var/www/html/storage/aiven-ca.pem`
3. ارفع ملف `ca.pem` من Aiven
4. `MYSQL_ATTR_SSL_CA=/var/www/html/storage/aiven-ca.pem`

---

## بعد النشر — اختبار

```
https://zones-api.onrender.com/up
https://zones-api.onrender.com/api/public/branding-settings
```

---

## ربط Vercel (React)

في Vercel → Environment:

```
VITE_API_BASE_URL=https://zones-api.onrender.com/api
```

---

## Dockerfile — موقعه

```
zones-backend-laravel/Dockerfile
zones-backend-laravel/docker/entrypoint.sh
```

Render يستخدم `rootDir: zones-backend-laravel` و `dockerfilePath: ./Dockerfile`.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Build failed | راجع Logs — Composer أو PHP extensions |
| DB connection refused | Aiven public access + SSL ca.pem |
| 502 بعد خمول | طبيعي Free tier — انتظر 30–60 ثانية |
| CORS | حدّث FRONTEND_URL على Render |
| APP_KEY missing | أضف APP_KEY في Environment |
