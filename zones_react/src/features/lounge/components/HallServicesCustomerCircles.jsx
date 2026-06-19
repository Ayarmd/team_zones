import { fetchCustomerHallServices } from "../data/managerHallStorage";

function CustomerServicePill({ label }) {
  return (
    <span className="inline-block rounded-full bg-[#6B5478] px-4 py-2 text-[11px] font-bold text-white shadow-sm shadow-[#6B5478]/25 dark:bg-[#6B5478] dark:text-white">
      {label}
    </span>
  );
}

export default function HallServicesCustomerCircles({ hallName, services, emptyHint }) {
  if (!services?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-900/50">
        <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
          {emptyHint || "لا توجد خدمات معروضة حالياً"}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          {hallName ? `صالة ${hallName}` : "المدير لم يفعّل أي خدمة بعد"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs font-extrabold text-gray-900 dark:text-white">الخدمات المتوفرة:</p>
      <div className="flex flex-wrap gap-2">
        {services.map((service) => (
          <CustomerServicePill key={service.key} label={service.shortLabel || service.label} />
        ))}
      </div>
    </div>
  );
}

/** يجلب من «API» ويعرض الخدمات النشطة فقط */
export function HallServicesCustomerPreview() {
  const payload = fetchCustomerHallServices();
  return (
    <HallServicesCustomerCircles
      hallName={payload.hallName}
      services={payload.services}
      emptyHint="لم تُفعَّل خدمات في هذه الصالة بعد"
    />
  );
}
