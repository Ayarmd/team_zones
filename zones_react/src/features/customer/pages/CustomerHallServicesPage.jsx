import { Link } from "react-router-dom";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { fetchCustomerHallServices } from "../../lounge/data/managerHallStorage";
import { HallServicesCustomerPreview } from "../../lounge/components/HallServicesCustomerCircles";
import CustomerAlertBanner from "../../alerts/components/CustomerAlertBanner";
import CustomerFeedbackForm from "../../interaction/components/CustomerFeedbackForm";
import CustomerCommentsPreview from "../../interaction/components/CustomerCommentsPreview";
import CustomerLoyaltyBalanceCard from "../../loyalty/components/CustomerLoyaltyBalanceCard";

export default function CustomerHallServicesPage() {
  const hall = fetchCustomerHallServices();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#f8f6fa] to-white px-4 py-8 dark:from-[#0c0a12] dark:to-[#110c1a]"
      dir="rtl"
    >
      <div className="mx-auto max-w-lg">
        <Link
          to="/auth/login"
          className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[#6B5478]"
        >
          <ArrowRight size={14} />
          العودة
        </Link>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          <img
            src={hall.image}
            alt={hall.hallName}
            className="h-40 w-full object-cover"
          />
          <div className="p-5">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#6B5478]">
              <Building2 size={14} />
              تطبيق الزبون
            </p>
            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">{hall.hallName}</h1>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} className="text-[#6B5478]" />
              {hall.city}
            </p>

            <CustomerAlertBanner />

            <CustomerLoyaltyBalanceCard />

            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-950/40">
              <HallServicesCustomerPreview />
            </div>

            <CustomerFeedbackForm />
            <CustomerCommentsPreview />

            <p className="mt-4 text-center text-[10px] text-gray-400">
              تُعرض للزبون الخدمات والملحقات المفعّلة فقط.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
