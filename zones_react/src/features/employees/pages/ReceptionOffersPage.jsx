import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import TablePagination from "../../../shared/components/TablePagination";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import OfferDetailsModal from "../../offers/components/OfferDetailsModal";
import { loadActivePackages, PACKAGES_STORAGE_EVENT } from "../../devices-packages/data/packagesStorage";
import {
  calcOfferPrice,
  formatDiscountPercent,
  formatOfferDate,
  formatOfferPrice,
} from "../../offers/data/offerMeta";
import { getOfferUsageCount, OFFER_BOOKINGS_EVENT } from "../../offers/data/offerBookingsStorage";
import {
  getOfferPackageLabel,
  getOfferPackagePrice,
  OFFERS_STORAGE_EVENT,
  loadOffers,
  refreshOffersFromApi,
} from "../../offers/data/offersStorage";

const PAGE_SIZE = 8;

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {active ? "مفعّل" : "معطّل"}
    </span>
  );
}

export default function ReceptionOffersPage() {
  const [offersList, setOffersList] = useState(() => loadOffers());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOffer, setDetailOffer] = useState(null);
  const [usageVersion, setUsageVersion] = useState(0);
  const [packages, setPackages] = useState(() => loadActivePackages());

  useEffect(() => {
    const sync = async () => {
      await refreshOffersFromApi();
      setOffersList(loadOffers());
    };
    sync();
    const onEvent = () => setOffersList(loadOffers());
    window.addEventListener(OFFERS_STORAGE_EVENT, onEvent);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(OFFERS_STORAGE_EVENT, onEvent);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    const syncPackages = () => setPackages(loadActivePackages());
    window.addEventListener(PACKAGES_STORAGE_EVENT, syncPackages);
    return () => window.removeEventListener(PACKAGES_STORAGE_EVENT, syncPackages);
  }, []);

  useEffect(() => {
    const refresh = () => setUsageVersion((v) => v + 1);
    refresh();
    window.addEventListener(OFFER_BOOKINGS_EVENT, refresh);
    return () => window.removeEventListener(OFFER_BOOKINGS_EVENT, refresh);
  }, [offersList]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return offersList;
    return offersList.filter(
      (o) =>
        o.name?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        String(o.discountPercent).includes(q) ||
        getOfferPackageLabel(o.packageId, packages).toLowerCase().includes(q),
    );
  }, [offersList, search, packages]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title="العروض"
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة العروض</h2>
          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
            {filtered.length} عرض
          </span>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث عن عرض..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">اسم العرض</th>
                <th className="px-3 py-2.5 font-bold">الباقة</th>
                <th className="px-3 py-2.5 font-bold">سعر الباقة</th>
                <th className="px-3 py-2.5 font-bold">نسبة الخصم</th>
                <th className="px-3 py-2.5 font-bold">سعر العرض</th>
                <th className="px-3 py-2.5 font-bold">تاريخ البداية</th>
                <th className="px-3 py-2.5 font-bold">تاريخ النهاية</th>
                <th className="px-3 py-2.5 font-bold">عدد مرات الاستخدام</th>
                <th className="px-3 py-2.5 font-bold">الحالة</th>
                <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-gray-400">
                    لا توجد عروض مطابقة.
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
                  const pkgPrice = getOfferPackagePrice(row.packageId, packages);
                  const offerPrice = calcOfferPrice(pkgPrice, row.discountPercent);
                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {getOfferPackageLabel(row.packageId, packages)}
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">
                        {formatOfferPrice(pkgPrice)}
                      </td>
                      <td className="px-3 py-3 font-bold text-amber-600 dark:text-amber-400">
                        {formatDiscountPercent(row.discountPercent ?? 0)}
                      </td>
                      <td className="px-3 py-3 font-bold text-[#6B5478]">{formatOfferPrice(offerPrice)}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatOfferDate(row.startDate)}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatOfferDate(row.endDate)}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {usageVersion >= 0 ? getOfferUsageCount(row.id, row) : 0}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={row.isActive !== false} />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <TableActionsGroup>
                          <IconButton
                            icon={Eye}
                            label="عرض التفاصيل"
                            tone="brand"
                            onClick={() => {
                              setDetailOffer({ ...row });
                              setDetailOpen(true);
                            }}
                          />
                        </TableActionsGroup>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </section>

      <OfferDetailsModal
        open={detailOpen}
        mode="details"
        offer={detailOffer}
        onClose={() => {
          setDetailOpen(false);
          setDetailOffer(null);
        }}
      />
    </div>
  );
}
