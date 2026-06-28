import { useEffect, useMemo, useState } from "react";
import { CircleCheck, Power, Tag, Trash2 } from "lucide-react";
import { zonesConfirm, zonesToastSuccess, zonesToastWarning } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import OfferDetailsModal from "../components/OfferDetailsModal";
import OfferRowActions from "../components/OfferRowActions";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  TableBulkActionBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import {
  filterItemsByIds,
  resolveBulkActionIds,
  useTableSelection,
} from "../../../shared/hooks/useTableSelection";
import { refreshHallCatalogFromApi } from "../../devices-packages/data/hallCatalogSync";
import { loadActivePackages, PACKAGES_STORAGE_EVENT } from "../../devices-packages/data/packagesStorage";
import {
  calcOfferPrice,
  formatDiscountPercent,
  formatOfferDate,
  formatOfferPrice,
} from "../data/offerMeta";
import {
  createManagerOffer,
  deleteManagerOffer,
  updateManagerOffer,
} from "../data/managerOffersApi";
import {
  getOfferPackageLabel,
  getOfferPackagePrice,
  OFFERS_STORAGE_EVENT,
  loadOffers,
  refreshOffersFromApi,
} from "../data/offersStorage";

const PAGE_SIZE = 5;

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

export default function OffersPage() {
  const [offersList, setOffersList] = useState(() => loadOffers());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [detailOffer, setDetailOffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState(() => loadActivePackages());

  const reloadOffers = async () => {
    setLoading(true);
    await refreshHallCatalogFromApi();
    const result = await refreshOffersFromApi();
    setOffersList(loadOffers());
    setLoading(false);
    return result;
  };

  useEffect(() => {
    reloadOffers();
  }, []);

  useEffect(() => {
    const syncPackages = () => setPackages(loadActivePackages());
    window.addEventListener(PACKAGES_STORAGE_EVENT, syncPackages);
    return () => window.removeEventListener(PACKAGES_STORAGE_EVENT, syncPackages);
  }, []);

  useEffect(() => {
    const syncOffers = () => setOffersList(loadOffers());
    window.addEventListener(OFFERS_STORAGE_EVENT, syncOffers);
    return () => window.removeEventListener(OFFERS_STORAGE_EVENT, syncOffers);
  }, []);

  const stats = useMemo(() => {
    const total = offersList.length;
    const active = offersList.filter((o) => o.isActive).length;
    return { total, active, inactive: total - active };
  }, [offersList]);

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
  const pageIds = useMemo(() => paged.map((row) => row.id), [paged]);
  const selection = useTableSelection({ items: offersList, pageIds });

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openAdd = () => {
    setDetailOffer(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setDetailOffer({ ...row });
    setModalMode("edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDetailOffer(null);
    setModalMode("add");
  };

  const handleSave = async (patch) => {
    const ok = await zonesConfirm({
      title: modalMode === "add" ? "هل تريد حفظ العرض؟" : "هل تريد حفظ التعديلات؟",
      confirmText: "نعم، احفظ",
      cancelText: "إلغاء",
    });
    if (!ok) return;

    const result =
      modalMode === "add"
        ? await createManagerOffer(patch)
        : await updateManagerOffer(detailOffer.id, patch);

    if (!result.ok) {
      zonesToastWarning(result.error || "تعذّر حفظ العرض");
      return;
    }

    await reloadOffers();
    closeModal();
    zonesToastSuccess(result.message || "تم الحفظ");
  };

  const runToggleActive = async (targetIds, rowForMessage, isActive) => {
    const isBulk = targetIds.length > 1;
    const targets = filterItemsByIds(offersList, targetIds);

    const confirmed = await zonesConfirm({
      title: isBulk
        ? isActive
          ? `تفعيل ${targetIds.length} عروض؟`
          : `تعطيل ${targetIds.length} عروض؟`
        : isActive
          ? "تفعيل العرض؟"
          : "تعطيل العرض؟",
      text: isBulk
        ? `سيتم ${isActive ? "تفعيل" : "تعطيل"} ${targetIds.length} عروض.`
        : `«${rowForMessage.name}» سيُ${isActive ? "فعَّل" : "عطَّل"}.`,
      confirmText: isActive ? "تفعيل" : "تعطيل",
      cancelText: "تراجع",
    });
    if (!confirmed) return;

    let success = 0;
    for (const row of targets) {
      const result = await updateManagerOffer(row.id, {
        name: row.name,
        packageId: row.packageId,
        discountPercent: row.discountPercent,
        description: row.description,
        startDate: row.startDate,
        endDate: row.endDate,
        isActive,
      });
      if (result.ok) success += 1;
    }

    if (success === 0) {
      zonesToastWarning("تعذّر تحديث الحالة");
      return;
    }

    selection.clearSelection();
    await reloadOffers();
    zonesToastSuccess(
      isBulk ? `تم ${isActive ? "تفعيل" : "تعطيل"} ${success} من ${targets.length} عروض` : "تم تحديث الحالة",
    );
  };

  const toggleActive = (row, isActive) =>
    runToggleActive(resolveBulkActionIds(row.id, selection.selectedIds), row, isActive);

  const handleBulkToggleActive = (isActive) => {
    const targets = filterItemsByIds(offersList, selection.selectedIds);
    if (!targets.length) return;
    runToggleActive(selection.selectedIds, targets[0], isActive);
  };

  const runDelete = async (targetIds, rowForMessage) => {
    const isBulk = targetIds.length > 1;
    const targets = filterItemsByIds(offersList, targetIds);

    const confirmed = await zonesConfirm({
      title: isBulk ? `حذف ${targetIds.length} عروض؟` : "حذف العرض؟",
      text: isBulk
        ? `سيتم حذف ${targetIds.length} عروض نهائياً من القائمة.`
        : `سيتم حذف «${rowForMessage.name}» نهائياً من القائمة.`,
      icon: "warning",
      confirmText: "حذف",
      cancelText: "تراجع",
      danger: true,
    });
    if (!confirmed) return;

    let success = 0;
    for (const row of targets) {
      const result = await deleteManagerOffer(row.id);
      if (result.ok) {
        success += 1;
        if (detailOffer?.id === row.id) closeModal();
      }
    }

    if (success === 0) {
      zonesToastWarning("تعذّر حذف العرض");
      return;
    }

    selection.clearSelection();
    await reloadOffers();
    zonesToastSuccess(isBulk ? `تم حذف ${success} من ${targets.length} عروض` : "تم الحذف");
  };

  const deleteOffer = (row) => runDelete(resolveBulkActionIds(row.id, selection.selectedIds), row);

  const handleBulkDelete = () => {
    const targets = filterItemsByIds(offersList, selection.selectedIds);
    if (!targets.length) return;
    runDelete(selection.selectedIds, targets[0]);
  };

  return (
    <ManagerLayout>
      <PageHeader
        title="إدارة العروض"
        description="ربط كل عرض بباقة مع نسبة خصم — يُحسب سعر العرض تلقائياً ويظهر في تطبيق الزبون."
      />

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="إجمالي العروض" value={stats.total} icon={Tag} />
          <KpiCard label="عروض مفعّلة" value={stats.active} icon={CircleCheck} tone="green" />
          <KpiCard label="عروض معطّلة" value={stats.inactive} icon={Power} tone="amber" />
        </div>
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة العروض</h2>
            <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
              {filtered.length} عرض
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
            <SearchBar value={search} onChange={setSearch} placeholder="بحث عن عرض..." />
            <Button size="sm" onClick={openAdd}>
              + إضافة عرض جديد
            </Button>
          </div>

          <TableBulkActionBar
            count={selection.count}
            onClear={selection.clearSelection}
            actions={[
              { label: "تفعيل المحدد", icon: Power, onClick: () => handleBulkToggleActive(true) },
              { label: "تعطيل المحدد", icon: CircleCheck, onClick: () => handleBulkToggleActive(false) },
              { label: "حذف المحدد", icon: Trash2, onClick: handleBulkDelete, variant: "danger" },
            ]}
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <TableSelectHeaderCell {...selection} />
                  <th className="px-3 py-2.5 font-bold">اسم العرض</th>
                  <th className="px-3 py-2.5 font-bold">الباقة</th>
                  <th className="px-3 py-2.5 font-bold">سعر الباقة</th>
                  <th className="px-3 py-2.5 font-bold">نسبة الخصم</th>
                  <th className="px-3 py-2.5 font-bold">سعر العرض</th>
                  <th className="px-3 py-2.5 font-bold">الوصف</th>
                  <th className="px-3 py-2.5 font-bold">تاريخ النهاية</th>
                  <th className="px-3 py-2.5 font-bold">الحالة</th>
                  <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-gray-400">
                      جاري تحميل العروض...
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  paged.map((row) => {
                    const pkgPrice = getOfferPackagePrice(row.packageId, packages);
                    const offerPrice = calcOfferPrice(pkgPrice, row.discountPercent);
                    return (
                      <tr key={row.id} className={selectableRowClass(selection.isSelected(row.id))}>
                        <TableSelectRowCell id={row.id} ariaLabel={`تحديد ${row.name}`} {...selection} />
                        <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                          {row.packageName || getOfferPackageLabel(row.packageId, packages)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200">
                          {formatOfferPrice(pkgPrice)}
                        </td>
                        <td className="px-3 py-3 font-bold text-amber-600 dark:text-amber-400">
                          {formatDiscountPercent(row.discountPercent ?? 0)}
                        </td>
                        <td className="px-3 py-3 font-bold text-[#6B5478]">{formatOfferPrice(offerPrice)}</td>
                        <td className="max-w-[180px] truncate px-3 py-3 text-gray-600 dark:text-gray-300">
                          {row.description || "—"}
                        </td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{formatOfferDate(row.endDate)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge active={row.isActive !== false} />
                        </td>
                        <td className={TABLE_ACTIONS_TD}>
                          <OfferRowActions
                            isActive={row.isActive !== false}
                            onEdit={() => openEdit(row)}
                            onToggle={(v) => toggleActive(row, v)}
                            onDelete={() => deleteOffer(row)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                {!loading && paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-gray-400">
                      لا توجد عروض مطابقة.
                    </td>
                  </tr>
                ) : null}
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
      </div>

      <OfferDetailsModal
        open={modalOpen}
        mode={modalMode}
        offer={detailOffer}
        onClose={closeModal}
        onSave={handleSave}
      />
    </ManagerLayout>
  );
}
