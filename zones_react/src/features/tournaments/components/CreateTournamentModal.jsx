import { useEffect, useState } from "react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { loadTournamentRows, saveTournamentRows } from "../tournamentsListStorage";

const COVER_MAX_EDGE = 1200;
const COVER_JPEG_QUALITY = 0.82;

const labelCls = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";
const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const fieldWrap = "rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40";
const formGrid4 = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4";

const EMPTY = {
  name: "",
  game: "",
  participants: "8",
  startDate: "",
  endDate: "",
  prize: "",
  delayMinutes: "10",
  withdrawal: "خسارة",
  tieRule: "يتم ترحيل المباراة للمراجعة",
  coverDataUrl: null,
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToCoverDataUrl(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("not-image");
  const dataUrl = await readFileAsDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("load-failed"));
    image.src = dataUrl;
  });
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) throw new Error("bad-dimensions");
  const scale = Math.min(1, COVER_MAX_EDGE / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", COVER_JPEG_QUALITY);
}

function formatDisplayDate(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  const [y, m, d] = p;
  return `${d}-${m}-${y}`;
}

export default function CreateTournamentModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setCoverError("");
    setCoverBusy(false);
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverError("");
    if (file.size > 12 * 1024 * 1024) {
      setCoverError("الملف كبير جداً (الحد الأقصى تقريباً 12 ميجابايت).");
      return;
    }
    setCoverBusy(true);
    try {
      const url = await fileToCoverDataUrl(file);
      set("coverDataUrl", url);
    } catch {
      setCoverError("تعذر قراءة الصورة. جرّب ملفاً آخر (JPG أو PNG).");
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const list = loadTournamentRows();
    const nid = Math.max(0, ...list.map((r) => r.id)) + 1;
    const n = Number(String(form.participants).replace(/\D/g, "")) || 8;
    if (n !== 8 && n !== 16) {
      setCoverError("عدد المشاركين يجب أن يكون 8 أو 16 فقط.");
      return;
    }
    const row = {
      id: nid,
      name: form.name.trim() || "بطولة بدون اسم",
      game: form.game.trim() || "—",
      participants: n,
      startDate: formatDisplayDate(form.startDate),
      status: "upcoming",
      endDate: formatDisplayDate(form.endDate),
      prize: form.prize.trim(),
      delayMinutes: Number(String(form.delayMinutes).replace(/\D/g, "")) || 10,
      withdrawal: form.withdrawal,
      tieRule: form.tieRule.trim(),
      ...(form.coverDataUrl ? { coverImage: form.coverDataUrl } : {}),
    };
    const ok = saveTournamentRows([...list, row]);
    if (!ok) {
      setCoverError("تعذر الحفظ: البيانات كبيرة جداً. جرّب صورة أصغر أو احذف الصورة.");
      return;
    }
    onSaved?.(row);
    onClose();
  };

  return (
    <AdminModal open={open} onClose={onClose} title="إضافة بطولة" xl>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4" dir="rtl">
        <div className={formGrid4}>
          <div className={fieldWrap}>
            <label htmlFor="ct-name" className={labelCls}>
              اسم البطولة <span className="text-red-500">*</span>
            </label>
            <input
              id="ct-name"
              className={inputCls}
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="أدخل اسم البطولة"
            />
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-game" className={labelCls}>
              اللعبة <span className="text-red-500">*</span>
            </label>
            <input
              id="ct-game"
              className={inputCls}
              required
              value={form.game}
              onChange={(e) => set("game", e.target.value)}
              placeholder="أدخل اسم اللعبة"
            />
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-participants" className={labelCls}>
              عدد المشاركين <span className="text-red-500">*</span>
            </label>
            <select
              id="ct-participants"
              className={inputCls}
              required
              value={form.participants}
              onChange={(e) => set("participants", e.target.value)}
            >
              <option value="8">8 مشاركين</option>
              <option value="16">16 مشارك</option>
            </select>
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-prize" className={labelCls}>
              الجائزة
            </label>
            <input
              id="ct-prize"
              className={inputCls}
              value={form.prize}
              onChange={(e) => set("prize", e.target.value)}
              placeholder="أدخل الجائزة"
            />
          </div>
        </div>

        <div className={formGrid4}>
          <div className={fieldWrap}>
            <label htmlFor="ct-start" className={labelCls}>
              تاريخ البداية <span className="text-red-500">*</span>
            </label>
            <input
              id="ct-start"
              type="date"
              className={inputCls}
              required
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-end" className={labelCls}>
              تاريخ النهاية <span className="text-red-500">*</span>
            </label>
            <input
              id="ct-end"
              type="date"
              className={inputCls}
              required
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-delay" className={labelCls}>
              في حالة التأخير <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="ct-delay"
                type="number"
                min={0}
                className={inputCls}
                required
                value={form.delayMinutes}
                onChange={(e) => set("delayMinutes", e.target.value)}
              />
              <span className="flex shrink-0 items-center rounded-xl border border-gray-300 px-3 text-xs font-bold text-gray-500 dark:border-gray-700">
                دقيقة
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">مدة التأخير المسموح بها قبل احتساب الخسارة</p>
          </div>
          <div className={fieldWrap}>
            <label htmlFor="ct-withdraw" className={labelCls}>
              في حالة الانسحاب <span className="text-red-500">*</span>
            </label>
            <input
              id="ct-withdraw"
              className={inputCls}
              required
              value={form.withdrawal}
              onChange={(e) => set("withdrawal", e.target.value)}
              placeholder="خسارة"
            />
          </div>
        </div>

        <div className={fieldWrap}>
          <label htmlFor="ct-tie" className={labelCls}>
            في حالة التعادل <span className="text-red-500">*</span>
          </label>
          <textarea
            id="ct-tie"
            rows={3}
            className={`${inputCls} min-h-[80px] resize-y`}
            required
            value={form.tieRule}
            onChange={(e) => set("tieRule", e.target.value)}
            placeholder="اكتب ما يحدث في حالة التعادل"
          />
        </div>

        <div className={fieldWrap}>
          <label htmlFor="ct-cover" className={labelCls}>
            صورة غلاف البطولة <span className="font-normal text-gray-400">(اختياري)</span>
          </label>
          <p className="mb-3 text-[10px] text-gray-400">يُعرض كبانر في صفحة التفاصيل. يُفضّل صورة أفقية.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="ct-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={coverBusy}
              onChange={handleCoverFile}
            />
            <label
              htmlFor="ct-cover"
              className={`inline-flex cursor-pointer rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#6B5478] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${coverBusy ? "pointer-events-none opacity-50" : ""}`}
            >
              {coverBusy ? "جاري المعالجة…" : "اختر صورة"}
            </label>
            {form.coverDataUrl ? (
              <button
                type="button"
                onClick={() => set("coverDataUrl", null)}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
              >
                إزالة الصورة
              </button>
            ) : null}
          </div>
          {coverError ? <p className="mt-2 text-[11px] font-bold text-red-600">{coverError}</p> : null}
          {form.coverDataUrl ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <img src={form.coverDataUrl} alt="" className="max-h-40 w-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm">
            حفظ البطولة
          </Button>
        </div>
      </form>
    </AdminModal>
  );
}
