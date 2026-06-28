# نشر ZONES — Aiven + Koyeb + Vercel

دليل نقل المشروع من الجهاز المحلي إلى الإنتاج.

| المكوّن | المنصة | المجلد في المستودع |
|---------|--------|-------------------|
| قاعدة البيانات MySQL | [Aiven](https://aiven.io) | — |
| Laravel API | [Koyeb](https://www.koyeb.com) | `zones-backend-laravel` |
| لوحة React | [Vercel](https://vercel.com) | `zones_react` |
| تطبيق Flutter | (لاحقاً) | `flutter-zones/final_p` |

المستودع: [github.com/Ayarmd/team_zones](https://github.com/Ayarmd/team_zones)

---

## 1) رفع الكود إلى GitHub (من جهازك)

افتح PowerShell:

```powershell
cd C:\Users\DELL\Desktop\team_zones

# تأكد أنك على main ومتصل بالمستودع الصحيح
git remote -v
# يجب أن يظهر: https://github.com/Ayarmd/team_zones.git

git status

# أضف كل التغييرات (لا يُرفع .env — محمي في .gitignore)
git add -A

git commit -m "$( @'
pre-deploy: API integration, bans/no-show, Koyeb+Aiven+Vercel config

Last tested local snapshot before production deploy.
'@ )"

# أول مرة قد تحتاج:
# git push -u origin main

git push origin main
```

بعد النجاح، حدّث صفحة GitHub وتأكد أن آخر commit ظهر.

---

## 2) Aiven — قاعدة بيانات MySQL

1. سجّل في [Aiven Console](https://console.aiven.io).
2. **Create service** → اختر **MySQL** → منطقة قريبة (مثلاً `aws-eu-central-1`) → خطة مناسبة.
3. انتظر حتى الحالة **Running**.
4. من **Overview** → **Connection information**:
   - Host
   - Port
   - User (`avnadmin`)
   - Password
   - Database (`defaultdb`)
5. حمّل **CA certificate** (`ca.pem`) — مطلوب لـ SSL.
6. فعّل **Public access** إذا Koyeb يتصل من الإنترنت (الوضع المعتاد).

احفظ القيم في ملف محلي (لا ترفعه لـ Git):

```text
deploy/aiven-mysql.env.example  ← مرجع للأسماء فقط
```

---

## 3) Koyeb — Laravel API

### 3.1 إنشاء التطبيق

1. [Koyeb Console](https://app.koyeb.com) → **Create App**.
2. **GitHub** → اختر مستودع `Ayarmd/team_zones` → فرع `main`.
3. **Builder**: Docker
4. **Work directory** (مهم جداً للمونوريبو):
   ```
   zones-backend-laravel
   ```
5. **Dockerfile**: `Dockerfile` (نسبياً داخل المجلد أعلاه)
6. **Port**: `8000`
7. **Health check**: HTTP `GET` → `/up` → port `8000`

أو استورد `koyeb.yaml` من جذر المستودع إذا Koyeb يدعم App spec من الملف.

### 3.2 متغيرات البيئة (Environment)

من `deploy/koyeb.env.example` — أهم القيم:

| المتغير | القيمة |
|---------|--------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | أنشئه: `php artisan key:generate --show` محلياً |
| `APP_URL` | رابط Koyeb بعد أول نشر (مثلاً `https://zones-api-xxx.koyeb.app`) |
| `FRONTEND_URL` | رابط Vercel لاحقاً |
| `CORS_ALLOWED_ORIGINS` | نفس رابط Vercel |
| `DB_*` | من Aiven |
| `MYSQL_ATTR_SSL_CA` | `/var/www/html/storage/aiven-ca.pem` |
| `FILESYSTEM_DISK` | `public` |
| `SESSION_DRIVER` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `CACHE_STORE` | `database` |

### 3.3 شهادة SSL لـ Aiven على Koyeb

**الطريقة البسيطة:** أضف ملف `ca.pem` في المستودع تحت  
`zones-backend-laravel/storage/aiven-ca.pem` **فقط إذا المستودع private** — أو ارفعه كـ **Secret** في Koyeb.

بدون الشهادة، الاتصال بـ Aiven قد يفشل.

### 3.4 أول نشر

- الـ `Dockerfile` يشغّل تلقائياً: `migrate --force` + `storage:link` + scheduler للـ No-Show.
- بعد النشر افتح: `https://YOUR-SERVICE.koyeb.app/up` → يجب `200`.
- جرّب: `https://YOUR-SERVICE.koyeb.app/api/public/branding-settings`

---

## 4) Vercel — React

### 4.1 إنشاء المشروع

1. [Vercel Dashboard](https://vercel.com) → **Add New** → **Project**.
2. Import من GitHub → `Ayarmd/team_zones`.
3. **Root Directory** → Edit → اختر:
   ```
   zones_react
   ```
4. Framework: **Vite** (يُكتشف تلقائياً من `vercel.json`).
5. Build: `npm run build` | Output: `dist`

### 4.2 متغيرات البيئة

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://YOUR-SERVICE.koyeb.app/api` |

طبّق على Production + Preview.

### 4.3 Deploy

اضغط **Deploy**. بعد النجاح افتح رابط Vercel وجرب تسجيل الدخول.

### 4.4 ربط CORS (عودة لـ Koyeb)

عدّل في Koyeb:

```
FRONTEND_URL=https://your-app.vercel.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app
APP_URL=https://your-service.koyeb.app
```

أعد نشر Koyeb (Redeploy) بعد تغيير المتغيرات.

---

## 5) ترتيب الربط الصحيح

```
1. Aiven MySQL     → شغّال + CA محفوظ
2. Koyeb API       → APP_KEY + DB_* → /up يعمل
3. Vercel React    → VITE_API_BASE_URL → Koyeb
4. Koyeb مرة ثانية → FRONTEND_URL + CORS → Vercel
5. اختبار كامل    → login + رفع صورة + حجز
```

---

## 6) أوامر مفيدة بعد النشر

```powershell
# توليد APP_KEY محلياً
cd C:\Users\DELL\Desktop\team_zones\zones-backend-laravel
php artisan key:generate --show

# اختبار API من الجهاز
curl.exe https://YOUR-SERVICE.koyeb.app/up
curl.exe https://YOUR-SERVICE.koyeb.app/api/public/branding-settings
```

---

## 7) ملفات الإعداد في المستودع

| الملف | الغرض |
|-------|--------|
| `zones-backend-laravel/Dockerfile` | بناء صورة Laravel لـ Koyeb |
| `zones-backend-laravel/docker/entrypoint.sh` | migrate + scheduler + serve |
| `koyeb.yaml` | مواصفات خدمة Koyeb (اختياري) |
| `zones_react/vercel.json` | إعدادات Vite SPA على Vercel |
| `deploy/koyeb.env.example` | قالب متغيرات Koyeb |
| `deploy/aiven-mysql.env.example` | قالب اتصال Aiven |
| `deploy/vercel.env.example` | قالب `VITE_API_BASE_URL` |

---

## 8) Flutter (لاحقاً)

عند بناء APK/IPA للإنتاج، مرّر:

```text
--dart-define=ZONEZ_PUBLIC_API_ROOT=https://YOUR-SERVICE.koyeb.app
```

راجع `flutter-zones/final_p/lib/core/config/api_config.dart`.

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `500` على Koyeb | راجع Logs → غالباً `APP_KEY` أو `DB_*` ناقص |
| DB connection refused | تحقق من Aiven public access + SSL CA |
| CORS في المتصفح | `FRONTEND_URL` و `CORS_ALLOWED_ORIGINS` على Koyeb |
| Vercel يبني من الجذر | تأكد Root Directory = `zones_react` |
| migrate فشل | راجع Koyeb logs؛ صلاحيات MySQL على Aiven |
