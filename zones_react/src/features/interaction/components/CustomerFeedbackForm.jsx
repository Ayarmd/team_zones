import { useState } from "react";
import { Send, Star } from "lucide-react";
import { zonesToastSuccess, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import { addCustomerComment } from "../data/customerCommentsStorage";

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

export default function CustomerFeedbackForm() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      zonesToastWarning("اكتب تعليقك قبل الإرسال");
      return;
    }

    addCustomerComment({
      customerName: name.trim() || "زبون",
      text: trimmed,
      rating,
    });

    setText("");
    setRating(5);
    zonesToastSuccess("شكراً — وصل تعليقك لمدير الصالة");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-[#6B5478]/15 bg-white p-4 dark:border-[#6B5478]/25 dark:bg-gray-900/60">
      <p className="text-sm font-extrabold text-gray-900 dark:text-white">شاركنا رأيك</p>
      <p className="mt-1 text-[11px] text-gray-500">يصل تعليقك مباشرة لمدير الصالة في قسم «تفاعل».</p>

      <div className="mt-3">
        <label className="mb-1 block text-[10px] font-bold text-gray-500">اسمك (اختياري)</label>
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: محمد"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[10px] font-bold text-gray-500">التعليق</label>
        <textarea
          rows={3}
          className={`${inputCls} resize-none`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="كيف كانت تجربتك في الصالة؟"
        />
      </div>

      <div className="mt-3">
        <span className="mb-1.5 block text-[10px] font-bold text-gray-500">التقييم</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-lg p-1 transition hover:bg-amber-50 dark:hover:bg-amber-950/20"
                aria-label={`${value} نجوم`}
              >
                <Star
                  size={18}
                  className={
                    value <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 dark:text-gray-600"
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B5478] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
      >
        <Send size={15} />
        إرسال التعليق
      </button>
    </form>
  );
}
