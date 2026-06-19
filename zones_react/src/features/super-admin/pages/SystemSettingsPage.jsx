import { useEffect, useRef, useState } from "react";
import {
  DatabaseBackup,
  FolderOpen,
  Globe,
  Loader2,
  Percent,
  Save,
  Sparkles,
  Upload,
  Wrench,
} from "lucide-react";
import { zonesConfirm, zonesSwal, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ToggleSwitch from "../components/ui/ToggleSwitch";
import PageHeader from "../components/ui/PageHeader";
import {
  MAX_COMMISSION_RATE,
  getSuperAdminState,
  runDatabaseBackup,
  updateSystemSettings,
} from "../data/superAdminStorage";
import {
  activateMaintenanceMode,
  countActiveBookingsToday,
  deactivateMaintenanceMode,
} from "../data/maintenanceModeData";
import { ZONES_LOGO_SRC } from "../data/superAdminDashboardData";
import { Input } from "../../../components/ui/input";
import {
  DEFAULT_POINTS_PER_SESSION,
  DEFAULT_REDEMPTION_THRESHOLD,
} from "../../loyalty/data/loyaltyPointsStorage";

const labelClass = "mb-2 block text-right text-[11px] font-extrabold text-gray-600 dark:text-gray-300";

function Card({ title, icon: Icon, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <h2 className="mb-5 flex items-center justify-end gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
        {title}
        <Icon size={16} className="text-[#6B5478]" />
      </h2>
      {children}
    </div>
  );
}

export default function SystemSettingsPage() {
  const [form, setForm] = useState(getSuperAdminState().systemSettings);
  const [backingUp, setBackingUp] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const refresh = () => setForm(getSuperAdminState().systemSettings);
    window.addEventListener("super-admin-data-updated", refresh);
    return () => window.removeEventListener("super-admin-data-updated", refresh);
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setRate = (raw) => {
    let v = Number(raw);
    if (Number.isNaN(v)) v = 0;
    if (v > MAX_COMMISSION_RATE) v = MAX_COMMISSION_RATE;
    if (v < 0) v = 0;
    set("globalCommissionRate", v);
  };

  const onLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") set("platformLogo", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onMaintenanceToggle = async (next) => {
    if (next) {
      const activeCount = countActiveBookingsToday();
      const result = await zonesSwal({
        icon: "warning",
        title: "تفعيل وضع الصيانة؟",
        html: `<div style="text-align:right;line-height:2;font-size:13px">
          <p>يوجد <strong>${activeCount}</strong> حجوزات نشطة اليوم.</p>
          <p>الحجوزات السابقة <strong>لن تُحذف</strong> وتبقى محفوظة في النظام.</p>
          <p>سيتم قفل الزبائن وموظفي الاستقبال. الأدمن فقط يبقى وصوله كاملاً.</p>
          <p style="margin-top:8px">هل تريد إرسال إشعار للزبائن المتأثرين؟</p>
        </div>`,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "تفعيل مع إشعار",
        denyButtonText: "تفعيل بدون إشعار",
        cancelButtonText: "إلغاء",
      });

      if (result.isConfirmed) {
        const res = activateMaintenanceMode({ notifyCustomers: true });
        setForm(getSuperAdminState().systemSettings);
        zonesToastSuccess(
          res.notifiedCount > 0
            ? `تم تفعيل وضع الصيانة وإشعار ${res.notifiedCount} زبون`
            : "تم تفعيل وضع الصيانة (لا توجد حجوزات تطبيق لإشعارها)",
        );
      } else if (result.isDenied) {
        activateMaintenanceMode({ notifyCustomers: false });
        setForm(getSuperAdminState().systemSettings);
        zonesToastSuccess("تم تفعيل وضع الصيانة");
      }
      return;
    }

    const ok = await zonesConfirm({
      title: "إيقاف وضع الصيانة؟",
      text: "سيعود النظام للعمل الطبيعي لجميع المستخدمين.",
      confirmText: "نعم، إيقاف",
    });
    if (!ok) return;
    deactivateMaintenanceMode();
    setForm(getSuperAdminState().systemSettings);
    zonesToastSuccess("تم إيقاف وضع الصيانة");
  };

  const setLoyaltyInt = (key, raw, fallback) => {
    let v = Number.parseInt(String(raw), 10);
    if (!Number.isFinite(v) || v < 1) v = fallback;
    set(key, v);
  };

  const save = () => {
    if (form.globalCommissionRate > MAX_COMMISSION_RATE) {
      zonesToastError(`الحد الأقصى لنسبة العمولة ${MAX_COMMISSION_RATE}%`);
      return;
    }
    if (!form.loyaltyPointsPerSession || form.loyaltyPointsPerSession < 1) {
      zonesToastError("نقاط كل جلسة يجب أن تكون 1 على الأقل.");
      return;
    }
    if (!form.loyaltyRedemptionThreshold || form.loyaltyRedemptionThreshold < 1) {
      zonesToastError("حد الدفع بالنقاط يجب أن يكون 1 على الأقل.");
      return;
    }
    updateSystemSettings(form);
    zonesToastSuccess("تم حفظ التغييرات");
  };

  const backup = async () => {
    setBackingUp(true);
    const res = await runDatabaseBackup();
    setBackingUp(false);
    setForm(getSuperAdminState().systemSettings);
    zonesSwal({
      icon: "success",
      title: "اكتمل النسخ الاحتياطي",
      text: new Date(res.at).toLocaleString("ar-LY"),
    });
  };

  const logoSrc = form.platformLogo || ZONES_LOGO_SRC;

  return (
    <div className="text-right" style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}>
      <PageHeader title="إعدادات النظام" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Card title="الإعدادات العامة" icon={Globe} className="mb-4">
          <div className="grid gap-6 lg:grid-cols-10 lg:items-stretch">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              <div>
                <label className={labelClass}>اسم المنصة</label>
                <Input
                  className="text-right"
                  value={form.platformName}
                  onChange={(e) => set("platformName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>البريد الإلكتروني للأدمن</label>
                <Input
                  dir="ltr"
                  className="text-left"
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => set("adminEmail", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>رابط المنصة</label>
                <Input
                  dir="ltr"
                  className="text-left"
                  value={form.platformUrl}
                  onChange={(e) => set("platformUrl", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>العملة</label>
                <Input
                  className="text-right"
                  value={form.currency || "د.ل"}
                  onChange={(e) => set("currency", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50/90 p-5 dark:border-gray-700 dark:bg-gray-800/50 lg:col-span-3">
              <p className={labelClass}>شعار المنصة</p>
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <img src={logoSrc} alt="شعار المنصة" className="h-full w-full object-contain p-2" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={onLogoPick}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-4 flex items-center gap-2 rounded-xl border border-[#6B5478]/30 bg-[#6B5478]/10 px-4 py-2 text-xs font-bold text-[#6B5478] transition hover:bg-[#6B5478]/15"
              >
                <Upload size={14} /> تحديث الصورة
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card title="العمولة" icon={Percent}>
            <div className="flex min-h-[168px] flex-col justify-between">
              <div>
                <label className={labelClass}>نسبة العمولة الحالية</label>
                <div className="relative w-full">
                  <Input
                    type="number"
                    min={0}
                    max={MAX_COMMISSION_RATE}
                    step={0.5}
                    dir="ltr"
                    className="text-left pe-3 ps-9"
                    value={form.globalCommissionRate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-gray-400">
                    %
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-[#6B5478]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
                  الافتراضي: 3%
                </span>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  الحد الأقصى: {MAX_COMMISSION_RATE}%
                </span>
              </div>
            </div>
          </Card>

          <Card title="نقاط الولاء" icon={Sparkles}>
            <div className="flex min-h-[168px] flex-col justify-between gap-4">
              <div>
                <label className={labelClass}>نقاط لكل جلسة مكتملة</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  dir="ltr"
                  className="text-left"
                  value={form.loyaltyPointsPerSession ?? DEFAULT_POINTS_PER_SESSION}
                  onChange={(e) => setLoyaltyInt("loyaltyPointsPerSession", e.target.value, DEFAULT_POINTS_PER_SESSION)}
                />
              </div>
              <div>
                <label className={labelClass}>الحد الأدنى لاستخدام النقاط (Threshold)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  dir="ltr"
                  className="text-left"
                  value={form.loyaltyRedemptionThreshold ?? DEFAULT_REDEMPTION_THRESHOLD}
                  onChange={(e) =>
                    setLoyaltyInt("loyaltyRedemptionThreshold", e.target.value, DEFAULT_REDEMPTION_THRESHOLD)
                  }
                />
              </div>
              <p className="text-[10px] font-semibold leading-relaxed text-gray-500 dark:text-gray-400">
                يُكتسب الرصيد عند إنهاء الجلسة (كاش/مدفوع). عند الدفع بالنقاط يُخصم الحد الأدنى فقط ويبقى
                الفرق في حساب الزبون. لا تُكتسب نقاط عن جلسة مدفوعة بالنقاط.
              </p>
            </div>
          </Card>

          <Card title="النسخ الاحتياطي" icon={DatabaseBackup}>
            <div className="flex min-h-[168px] flex-col justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                آخر نسخة:
                <span className="mt-1 block font-extrabold text-gray-800 dark:text-gray-100" dir="ltr">
                  {form.lastBackupAt ? new Date(form.lastBackupAt).toLocaleString("ar-LY") : "لا يوجد"}
                </span>
              </p>
              <button
                type="button"
                onClick={backup}
                disabled={backingUp}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B5478] py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#5a4665] disabled:opacity-60"
              >
                {backingUp ? <Loader2 size={15} className="animate-spin" /> : <FolderOpen size={15} />}
                {backingUp ? "جاري النسخ..." : "إنشاء نسخة احتياطية الآن"}
              </button>
            </div>
          </Card>

          <Card title="وضع الصيانة" icon={Wrench}>
            <div className="flex min-h-[168px] flex-col items-end justify-between">
              <div className="w-full text-right">
                <p className={labelClass}>حالة النظام</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${
                    form.maintenanceMode
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {form.maintenanceMode ? "مفعّل" : "غير مفعل"}
                </span>
              </div>
              <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/40">
                <ToggleSwitch checked={form.maintenanceMode} onChange={onMaintenanceToggle} />
                <p className="text-xs font-extrabold text-gray-900 dark:text-white">تفعيل وضع الصيانة</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-[#6B5478] px-10 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#5a4665]"
          >
            <Save size={14} /> حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  );
}
