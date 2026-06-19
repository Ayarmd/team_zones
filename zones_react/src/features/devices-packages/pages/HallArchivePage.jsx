import { useEffect, useMemo, useState } from "react";
import { ArchiveRestore, Eye, Gamepad2, Package } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import { zonesConfirm, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import DeviceDetailsModal from "../components/DeviceDetailsModal";
import PackageDetailsModal from "../components/PackageDetailsModal";
import { getDevicePackageLabel, loadDevices, saveDevices } from "../data/devicesStorage";
import { loadPackages, savePackages } from "../data/packagesStorage";
import { formatDisplayDate, formatFaultDateTime } from "../../maintenance/data/faultMeta";
import { getDeviceLastMaintenance } from "../utils/deviceMaintenance";
import { useDevicesSync } from "../hooks/useDevicesSync";
import { usePackagesSync } from "../hooks/usePackagesSync";

const PAGE_SIZE = 8;

function ArchiveRowActions({ onDetails, onRestore }) {
  return (
    <TableActionsGroup>
      <IconButton icon={Eye} label="تفاصيل" tone="brand" onClick={onDetails} />
      <IconButton icon={ArchiveRestore} label="استعادة" tone="success" onClick={onRestore} />
    </TableActionsGroup>
  );
}

export default function HallArchivePage() {
  const [devicesList, setDevicesList] = useState(() => loadDevices());
  const [packagesList, setPackagesList] = useState(() => loadPackages());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deviceDetailOpen, setDeviceDetailOpen] = useState(false);
  const [detailDevice, setDetailDevice] = useState(null);
  const [packageDetailOpen, setPackageDetailOpen] = useState(false);
  const [detailPackage, setDetailPackage] = useState(null);

  useEffect(() => {
    saveDevices(devicesList);
  }, [devicesList]);

  useEffect(() => {
    savePackages(packagesList);
  }, [packagesList]);

  useDevicesSync(setDevicesList);
  usePackagesSync(setPackagesList);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const archivedRows = useMemo(() => {
    const devices = devicesList
      .filter((d) => d.isArchived)
      .map((d) => ({
        key: `device-${d.id}`,
        kind: "device",
        kindLabel: "جهاز",
        name: d.name,
        subLabel: d.typeLabel,
        archivedAt: d.archivedAt,
        raw: d,
      }));
    const packages = packagesList
      .filter((p) => p.isArchived)
      .map((p) => ({
        key: `package-${p.id}`,
        kind: "package",
        kindLabel: "باقة",
        name: p.name,
        subLabel: p.hours || p.price,
        archivedAt: p.archivedAt,
        raw: p,
      }));
    return [...devices, ...packages].sort((a, b) =>
      String(b.archivedAt || "").localeCompare(String(a.archivedAt || "")),
    );
  }, [devicesList, packagesList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return archivedRows;
    return archivedRows.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.subLabel?.toLowerCase().includes(q) ||
        r.kindLabel.includes(q),
    );
  }, [archivedRows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openDetails = (row) => {
    if (row.kind === "device") {
      setDetailDevice({ ...row.raw });
      setDeviceDetailOpen(true);
      return;
    }
    setDetailPackage({ ...row.raw });
    setPackageDetailOpen(true);
  };

  const restoreRow = async (row) => {
    const ok = await zonesConfirm({
      title: "استعادة العنصر؟",
      text: `سيتم إرجاع «${row.name}» إلى القائمة النشطة.`,
      confirmText: "استعادة",
      cancelText: "إلغاء",
    });
    if (!ok) return;

    if (row.kind === "device") {
      setDevicesList((list) =>
        list.map((d) =>
          d.id === row.raw.id ? { ...d, isArchived: false, archivedAt: null, isActive: true } : d,
        ),
      );
      setDeviceDetailOpen(false);
      setDetailDevice(null);
    } else {
      setPackagesList((list) =>
        list.map((p) =>
          p.id === row.raw.id ? { ...p, isArchived: false, archivedAt: null, isActive: true } : p,
        ),
      );
      setPackageDetailOpen(false);
      setDetailPackage(null);
    }

    zonesToastSuccess("تمت الاستعادة");
  };

  return (
    <ManagerLayout>
      <PageHeader
        title="أرشيف الصالة"
        description="الأجهزة والباقات المؤرشفة — يمكن استعادتها أو عرض تفاصيلها."
      />

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">سجل الأرشيف</h2>
          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
            {filtered.length} عنصر
          </span>
        </div>

        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <SearchBar value={search} onChange={setSearch} placeholder="بحث في الأرشيف..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-3 py-2.5 font-bold">النوع</th>
                <th className="px-3 py-2.5 font-bold">الاسم</th>
                <th className="px-3 py-2.5 font-bold">التفاصيل</th>
                <th className="px-3 py-2.5 font-bold">تاريخ الأرشفة</th>
                <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paged.map((row) => (
                <tr key={row.key} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        row.kind === "device"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                          : "bg-[#6B5478]/12 text-[#6B5478]"
                      }`}
                    >
                      {row.kind === "device" ? <Gamepad2 size={12} /> : <Package size={12} />}
                      {row.kindLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100" dir={row.kind === "device" ? "ltr" : undefined}>
                    {row.name}
                  </td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.subLabel || "—"}</td>
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                    {formatDisplayDate(row.archivedAt)}
                  </td>
                  <td className={TABLE_ACTIONS_TD}>
                    <ArchiveRowActions onDetails={() => openDetails(row)} onRestore={() => restoreRow(row)} />
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-gray-400">
                    لا توجد عناصر مؤرشفة حالياً.
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

      <DeviceDetailsModal
        open={deviceDetailOpen}
        mode="details"
        device={detailDevice}
        packages={packagesList}
        devices={devicesList}
        onClose={() => {
          setDeviceDetailOpen(false);
          setDetailDevice(null);
        }}
        lastMaintenance={detailDevice ? getDeviceLastMaintenance(detailDevice.id) : "—"}
      />

      <PackageDetailsModal
        open={packageDetailOpen}
        mode="details"
        pkg={detailPackage}
        onClose={() => {
          setPackageDetailOpen(false);
          setDetailPackage(null);
        }}
      />
    </ManagerLayout>
  );
}
