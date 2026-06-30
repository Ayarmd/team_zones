# نشر ZONES React على Vercel

المستودع: https://github.com/jeje430/myzones

## ما يُنشر على Vercel

لوحة الويب React فقط (مجلد `zones_react`).

Laravel API يُنشر على Render أو CyberPanel أو Railway — ليس على Vercel.

---

## خطوات النشر (مرة واحدة)

1. ادخل https://vercel.com وسجّل بحساب GitHub.
2. New Project → Import → اختر `jeje430/myzones`.
3. إعدادات المشروع:

| الحقل | القيمة |
|--------|--------|
| Framework Preset | Vite |
| Root Directory | اتركه فارغاً (جذر المستودع) |
| Build Command | يُقرأ من `vercel.json` |
| Output Directory | `zones_react/dist` |

4. Environment Variables → أضف:

```
VITE_API_BASE_URL=https://YOUR-API-DOMAIN/api
```

مثال بعد رفع Laravel:

```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

5. Deploy.

---

## بعد كل deploy

تأكد في Laravel (`.env` على السيرفر أو Render):

```
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://your-app.vercel.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app
```

---

## الملفات

| الملف | الغرض |
|--------|--------|
| `/vercel.json` | إعدادات البناء من جذر المستودع |
| `/zones_react/vercel.json` | نفس الإعداد إذا Root Directory = `zones_react` |
| `/vercel/env.example` | متغيرات البيئة المطلوبة |
| `/.vercelignore` | استبعاد Laravel و Flutter من رفع Vercel |

---

## Root Directory: أيهما؟

**الطريقة أ (موصى بها):** Root فارغ → يستخدم `/vercel.json` في الجذر.

**الطريقة ب:** Root = `zones_react` → يستخدم `/zones_react/vercel.json`.

---

## اختبار محلي قبل الرفع

```powershell
cd zones_react
npm install
npm run build
npm run preview
```

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| صفحة بيضاء بعد النشر | تأكد من rewrites في vercel.json |
| API لا يعمل | راجع `VITE_API_BASE_URL` في Vercel → Redeploy |
| CORS | حدّث `FRONTEND_URL` على Laravel |
| 404 عند تحديث الصفحة | rewrites SPA مفعّلة في vercel.json |
