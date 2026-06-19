import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  getCustomerByPhone,
  getLoyaltySettings,
  LOYALTY_UPDATED_EVENT,
} from "../data/loyaltyPointsStorage";

const DEMO_PHONE = "0912345678";

export default function CustomerLoyaltyBalanceCard() {
  const [settings, setSettings] = useState(() => getLoyaltySettings());
  const [customer, setCustomer] = useState(() => getCustomerByPhone(DEMO_PHONE));

  useEffect(() => {
    const refresh = () => {
      setSettings(getLoyaltySettings());
      setCustomer(getCustomerByPhone(DEMO_PHONE));
    };
    window.addEventListener(LOYALTY_UPDATED_EVENT, refresh);
    window.addEventListener("super-admin-data-updated", refresh);
    return () => {
      window.removeEventListener(LOYALTY_UPDATED_EVENT, refresh);
      window.removeEventListener("super-admin-data-updated", refresh);
    };
  }, []);

  const balance = customer?.pointsBalance ?? 0;
  const canPay = balance >= settings.redemptionThreshold;

  return (
    <div className="mt-5 rounded-2xl border border-[#6B5478]/20 bg-gradient-to-br from-[#6B5478]/8 to-transparent p-4 dark:border-[#6B5478]/30 dark:from-[#6B5478]/15">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#6B5478]">
            <Sparkles size={14} />
            نقاط الولاء
          </p>
          <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">{balance} نقطة</p>
          <p className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            +{settings.pointsPerSession} نقطة بعد كل جلسة مكتملة (كاش/مدفوع)
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
            canPay
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {canPay ? "يمكن الدفع بالنقاط" : `تحتاج ${settings.redemptionThreshold} نقطة`}
        </span>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
        معاينة حساب الزبون ({customer?.name || DEMO_PHONE}). عند إتمام الجلسة يظهر إشعار: «لقد حصلت على{" "}
        {settings.pointsPerSession} نقاط جديدة».
      </p>
    </div>
  );
}
