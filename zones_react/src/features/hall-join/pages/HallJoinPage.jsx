import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ImagePlus,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import ThemePill from "../../../shared/components/ThemePill";
import IconButton from "../../../shared/components/ui/IconButton";
import IconGlyph from "../../../shared/components/ui/IconGlyph";
import { submitHallJoinRequest } from "../../super-admin/data/superAdminStorage";

const CARD =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-gray-200/40 transition-colors dark:border-slate-700/70 dark:bg-[#110c1a] dark:shadow-black/25";
const LABEL = "mb-1.5 block text-xs font-bold text-gray-600 dark:text-slate-300";
const INPUT =
  "w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/25 dark:border-slate-700 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500";

function readImageFiles(files, max = 5) {
  const list = Array.from(files || []).slice(0, max);
  return Promise.all(
    list.map(
      (file) =>
        new Promise((resolve, reject) => {
          if (!file.type.startsWith("image/")) {
            reject(new Error("نوع ملف غير مدعوم"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function SuccessModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-[#110c1a]">
        <IconGlyph icon={CheckCircle2} tone="green" size={32} className="mx-auto mb-4" />
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">تم إرسال طلبك بنجاح!</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-300">
          جاري مراجعة البيانات من قبل الإدارة وسنتواصل معك قريباً عبر البريد الإلكتروني.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-[#6B5478] py-3 text-sm font-bold text-white transition hover:bg-[#5a4665]"
        >
          حسناً
        </button>
      </div>
    </div>
  );
}

function WelcomeStep({ onStart }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#6B5478]/15 ring-1 ring-[#6B5478]/30 dark:bg-[#6B5478]/20 dark:ring-[#6B5478]/40">
        <img src="/zones-logo.png" alt="ZONES" className="h-full w-full object-cover" />
      </span>
      <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[#6B5478]">
        <Sparkles size={14} />
        انضم إلى ZONES
      </p>
      <h1 className="max-w-lg text-xl font-extrabold leading-relaxed text-gray-900 dark:text-white md:text-2xl">
        قم بإضافة صالتك إلى منصة ZONES وابدأ بإدارة حجوزاتك ذكياً
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">
        سجّل بيانات صالتك في دقائق، وسيقوم فريق الإدارة بمراجعة طلبك والتواصل معك لإتمام التفعيل.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 min-w-[200px] rounded-2xl bg-[#6B5478] px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#6B5478]/25 transition hover:bg-[#5a4665] hover:shadow-[#6B5478]/40 dark:shadow-[#6B5478]/30"
      >
        ابدأ الآن
      </button>
      <Link
        to="/auth/login"
        className="mt-6 text-xs font-semibold text-gray-500 transition hover:text-[#6B5478] dark:text-slate-500"
      >
        لديك حساب؟ تسجيل الدخول
      </Link>
    </div>
  );
}

function RegistrationForm({ onBack, onSuccess }) {
  const fileRef = useRef(null);
  const [hallName, setHallName] = useState("");
  const [address, setAddress] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [email, setEmail] = useState("");
  const [commercialPhone, setCommercialPhone] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleImages = async (fileList) => {
    setError("");
    try {
      const urls = await readImageFiles(fileList, 5);
      setImagePreviews((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      setError("يرجى رفع صور بصيغة JPG أو PNG فقط.");
    }
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = submitHallJoinRequest({
      hallName,
      address,
      mapLink,
      email,
      commercialPhone,
      images: imagePreviews,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "تعذر إرسال الطلب.");
      return;
    }
    onSuccess();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-xs font-bold text-gray-500 transition hover:text-[#6B5478] dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowRight size={16} />
        العودة للترحيب
      </button>

      <div className={`${CARD} mb-5`}>
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">نموذج طلب الانضمام</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          أدخل بيانات صالتك بدقة — ستظهر للإدارة فور الإرسال.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className={CARD}>
          <label className={LABEL}>
            <Building2 size={13} className="me-1 inline text-[#6B5478]" />
            اسم الصالة
          </label>
          <input
            type="text"
            value={hallName}
            onChange={(e) => setHallName(e.target.value)}
            placeholder="مثال: صالة الأبطال VIP"
            className={INPUT}
            required
          />
        </div>

        <div className={CARD}>
          <label className={LABEL}>
            <MapPin size={13} className="me-1 inline text-[#6B5478]" />
            مكان الصالة / العنوان
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="مثال: طرابلس — شارع الجمهورية"
            className={INPUT}
            required
          />
        </div>

        <div className={CARD}>
          <label className={LABEL}>رابط الموقع على الخريطة (Google Maps)</label>
          <input
            type="url"
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            placeholder="https://maps.google.com/..."
            className={INPUT}
            dir="ltr"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={CARD}>
            <label className={LABEL}>
              <Mail size={13} className="me-1 inline text-[#6B5478]" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@gmail.com"
              className={INPUT}
              dir="ltr"
              required
            />
          </div>
          <div className={CARD}>
            <label className={LABEL}>
              <Phone size={13} className="me-1 inline text-[#6B5478]" />
              رقم الهاتف التجاري
            </label>
            <input
              type="tel"
              value={commercialPhone}
              onChange={(e) => setCommercialPhone(e.target.value)}
              placeholder="091 000 0000"
              className={INPUT}
              dir="ltr"
              required
            />
          </div>
        </div>

        <div className={CARD}>
          <label className={LABEL}>
            <ImagePlus size={13} className="me-1 inline text-[#6B5478]" />
            صور الصالة
          </label>
          <p className="mb-3 text-[11px] text-gray-400 dark:text-slate-500">يمكنك رفع حتى 5 صور (JPG, PNG)</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleImages(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-6 text-xs font-bold text-gray-600 transition hover:border-[#6B5478] hover:text-[#6B5478] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-white"
          >
            <ImagePlus size={18} className="text-[#6B5478]" />
            اضغط لرفع صور الصالة
          </button>

          {imagePreviews.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {imagePreviews.map((src, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700"
                >
                  <img src={src} alt={`صورة ${i + 1}`} className="h-full w-full object-cover" />
                  <IconButton
                    icon={X}
                    label="حذف الصورة"
                    size={12}
                    tone="muted"
                    className="absolute start-1 top-1 text-white opacity-0 drop-shadow-md transition group-hover:opacity-100"
                    onClick={() => removeImage(i)}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-[#6B5478] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#6B5478]/20 transition hover:bg-[#5a4665] disabled:opacity-60 dark:shadow-[#6B5478]/25"
        >
          {submitting ? "جاري الإرسال..." : "إرسال طلب الانضمام"}
        </button>
      </form>
    </div>
  );
}

export default function HallJoinPage() {
  const [step, setStep] = useState("welcome");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    setStep("welcome");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300 dark:bg-[#0b1020] dark:text-white"
      style={{ fontFamily: "Cairo, 'Segoe UI', Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(107,84,120,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(107,84,120,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(74,127,212,0.08),transparent_40%)]" />

      <header className="relative border-b border-gray-200 bg-white/85 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b1020]/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl ring-1 ring-[#6B5478]/25 dark:ring-[#6B5478]/40">
              <img src="/zones-logo.png" alt="ZONES" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">ZONES</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-500">انضمام مديري الصالات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemePill />
            <Link
              to="/auth/login"
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-[11px] font-bold text-gray-600 transition hover:border-[#6B5478] hover:text-[#6B5478] dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-8 md:py-12">
        {step === "welcome" ? (
          <WelcomeStep onStart={() => setStep("form")} />
        ) : (
          <RegistrationForm onBack={() => setStep("welcome")} onSuccess={handleSuccess} />
        )}
      </main>

      {showSuccess ? <SuccessModal onClose={() => setShowSuccess(false)} /> : null}
    </div>
  );
}
