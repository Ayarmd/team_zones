import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Archive,
  CircleCheck,
  Eye,
  Gamepad2,
  Package,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  zonesConfirm,
  zonesToastError,
  zonesToastSuccess,
  zonesToastWarning,
} from "../../../shared/utils/zonesAlerts";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import TablePagination from "../../../shared/components/TablePagination";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import Button from "../../super-admin/components/ui/Button";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import {
  getDevicePackageLabel,
  loadDevices,
  saveDevices,
  suggestDeviceName,
} from "../data/devicesStorage";
import { loadPackages, savePackages } from "../data/packagesStorage";
import { normalizeDeviceCodeName, typeLabelFromType } from "../data/deviceNaming";
import { saveCustomDeviceType } from "../data/customDeviceTypesStorage";
import { getDeviceLastMaintenance } from "../utils/deviceMaintenance";
import { useDevicesSync } from "../hooks/useDevicesSync";
import { usePackagesSync } from "../hooks/usePackagesSync";
import { formatDisplayDate, formatFaultDateTime } from "../../maintenance/data/faultMeta";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import DeviceDetailsModal from "../components/DeviceDetailsModal";
import DeviceMaintenanceStatusControl from "../components/DeviceMaintenanceStatusControl";
import PackageDetailsModal from "../components/PackageDetailsModal";
import { isDeviceBroken, loadSyncedActiveDevices } from "../utils/deviceFaultSync";
import { MAINTENANCE_FAULTS_EVENT } from "../../maintenance/data/maintenanceFaultsStorage";
import {
  disableDeviceFromManager,
  reconcileDisabledDevicesWithoutFaults,
  tryEnableDevice,
} from "../../maintenance/utils/maintenanceWorkflow";

const PAGE_SIZE = 5;

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/15 text-red-600 dark:text-red-400"
      }`}
    >
      {active ? "مفعّل" : "معطّل"}
    </span>
  );
}

function TableRowActions({ onDetails, onEdit, onToggleActive, active, onArchive }) {
  const isActive = active !== false;
  return (
    <TableActionsGroup>
      <IconButton icon={Eye} label="عرض التفاصيل" tone="brand" onClick={onDetails} />
      <IconButton icon={Pencil} label="تعديل" tone="brand" onClick={onEdit} />
      {isActive ? (
        <IconButton icon={PowerOff} label="تعطيل الجهاز" tone="warning" onClick={onToggleActive} />
      ) : (
        <IconButton icon={Power} label="تفعيل الجهاز" tone="success" onClick={onToggleActive} />
      )}
      <IconButton icon={Archive} label="أرشفة" tone="warning" onClick={onArchive} />
    </TableActionsGroup>
  );
}

function PackageTableRowActions({ onDetails, onEdit, onToggleActive, active, onArchive }) {
  const isActive = active !== false;
  return (
    <TableActionsGroup>
      <IconButton icon={Eye} label="عرض التفاصيل" tone="brand" onClick={onDetails} />
      <IconButton icon={Pencil} label="تعديل" tone="brand" onClick={onEdit} />
      {isActive ? (
        <IconButton icon={PowerOff} label="تعطيل الباقة" tone="warning" onClick={onToggleActive} />
      ) : (
        <IconButton icon={Power} label="تفعيل الباقة" tone="success" onClick={onToggleActive} />
      )}
      <IconButton icon={Archive} label="أرشفة" tone="warning" onClick={onArchive} />
    </TableActionsGroup>
  );
}

export default function DevicesPackagesPage() {
  const { pathname } = useLocation();
  const tab = pathname.includes("/packages") ? "packages" : "devices";
  const session = getAuthSession();

  const [devicesList, setDevicesList] = useState(() => loadDevices());
  const [packagesList, setPackagesList] = useState(() => loadPackages());

  const [deviceSearch, setDeviceSearch] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [devicePage, setDevicePage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);

  const [deviceDetailOpen, setDeviceDetailOpen] = useState(false);
  const [deviceModalMode, setDeviceModalMode] = useState("details");
  const [detailDevice, setDetailDevice] = useState(null);

  const [packageDetailOpen, setPackageDetailOpen] = useState(false);
  const [packageModalMode, setPackageModalMode] = useState("details");
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
    const synced = reconcileDisabledDevicesWithoutFaults(session?.fullName || "مدير الصالة");
    if (synced) setDevicesList(loadDevices());
  }, [session?.fullName]);

  useEffect(() => {
    const refreshFromFaults = () => setDevicesList(loadDevices());
    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refreshFromFaults);
    return () => window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refreshFromFaults);
  }, []);

  useEffect(() => {
    setDevicePage(1);
  }, [deviceSearch, tab]);

  useEffect(() => {
    setPackagePage(1);
  }, [packageSearch, tab]);

  useEffect(() => {
    setDetailDevice((cur) => {
      if (!cur) return cur;
      return devicesList.find((d) => d.id === cur.id) ?? cur;
    });
  }, [devicesList]);

  useEffect(() => {
    setDetailPackage((cur) => {
      if (!cur) return cur;
      return packagesList.find((p) => p.id === cur.id) ?? cur;
    });
  }, [packagesList]);

  const activeDevices = useMemo(
    () => devicesList.filter((d) => !d.isArchived),
    [devicesList],
  );

  const activePackages = useMemo(
    () => packagesList.filter((p) => !p.isArchived),
    [packagesList],
  );

  const filteredDevices = useMemo(() => {
    const q = deviceSearch.trim().toLowerCase();
    if (!q) return activeDevices;
    return activeDevices.filter((d) => {
      const pkgLabel = getDevicePackageLabel(d.packageId, packagesList).toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.typeLabel?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q) ||
        pkgLabel.includes(q)
      );
    });
  }, [activeDevices, deviceSearch, packagesList]);

  const filteredPackages = useMemo(() => {
    const q = packageSearch.trim().toLowerCase();
    if (!q) return activePackages;
    return activePackages.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.deviceLabel?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [activePackages, packageSearch]);

  const deviceTotalPages = Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  const packageTotalPages = Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE));

  const pageDevices = useMemo(
    () => filteredDevices.slice((devicePage - 1) * PAGE_SIZE, devicePage * PAGE_SIZE),
    [filteredDevices, devicePage],
  );

  const pagePackages = useMemo(
    () => filteredPackages.slice((packagePage - 1) * PAGE_SIZE, packagePage * PAGE_SIZE),
    [filteredPackages, packagePage],
  );

  const syncedDevices = useMemo(() => loadSyncedActiveDevices(), [devicesList]);

  const deviceStats = useMemo(() => {
    const inMaintenance = syncedDevices.filter((d) => isDeviceBroken(d)).length;
    const healthy = syncedDevices.length - inMaintenance;
    return {
      total: syncedDevices.length,
      healthy,
      inMaintenance,
    };
  }, [syncedDevices]);

  const refreshDevicesFromStorage = () => setDevicesList(loadDevices());

  const packageStats = useMemo(() => {
    const list = packagesList.filter((p) => !p.isArchived);
    const active = list.filter((p) => p.isActive).length;
    return { total: list.length, active, inactive: list.length - active };
  }, [packagesList]);

  const openAddDevice = () => {
    setDetailDevice(null);
    setDeviceModalMode("add");
    setDeviceDetailOpen(true);
  };

  const openEditDevice = (row) => {
    setDetailDevice({ ...row });
    setDeviceModalMode("edit");
    setDeviceDetailOpen(true);
  };

  const openDeviceDetail = (row) => {
    setDetailDevice({ ...row });
    setDeviceModalMode("details");
    setDeviceDetailOpen(true);
  };

  const closeDeviceModal = () => {
    setDeviceDetailOpen(false);
    setDetailDevice(null);
    setDeviceModalMode("details");
  };

  const resolveDeviceName = (patch) => {
    const rawName = patch.name?.trim();
    let codeName;

    if (rawName) {
      codeName = normalizeDeviceCodeName(rawName, patch.type);
      if (!codeName) {
        zonesToastError(
          "استخدم صيغة مثل PC-01 أو PC-016 (نوع الجهاز ثم رقم بدون تكرار الشرطة).",
          "رقم الجهاز غير صالح",
        );
        return null;
      }
    } else {
      codeName = suggestDeviceName(patch.type, devicesList);
    }

    const duplicate = devicesList.some(
      (d) => d.name.toUpperCase() === codeName.toUpperCase() && d.id !== detailDevice?.id,
    );
    if (duplicate) {
      zonesToastError(`الجهاز «${codeName}» موجود مسبقاً. اختر رقماً آخر.`, "رقم الجهاز مستخدم");
      return null;
    }
    return codeName;
  };

  const saveDeviceAdd = async (patch) => {
    if (!patch.packageId) {
      zonesToastWarning("اختر الباقة التابعة للجهاز");
      return;
    }

    const confirmed = await zonesConfirm({
      title: "هل تريد حفظ الجهاز؟",
      confirmText: "نعم، احفظ",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const codeName = resolveDeviceName(patch);
    if (!codeName) return;

    const typeLabel = patch.typeLabel || typeLabelFromType(patch.type);
    saveCustomDeviceType({ type: patch.type, typeLabel });
    const nid = Math.max(0, ...devicesList.map((d) => d.id)) + 1;
    setDevicesList((list) => {
      const next = [
        ...list,
        {
          id: nid,
          name: codeName,
          type: patch.type,
          typeLabel,
          packageId: patch.packageId,
          isActive: patch.isActive,
          hasFault: false,
          isArchived: false,
          price: "—",
          image: null,
          notes: patch.notes || "",
          createdAt: formatFaultDateTime(),
        },
      ];
      saveDevices(next);
      return next;
    });
    closeDeviceModal();
    zonesToastSuccess("تم الحفظ");
  };

  const saveDeviceEdit = async (patch) => {
    if (!detailDevice) return;
    const confirmed = await zonesConfirm({
      title: "هل تريد حفظ التعديلات؟",
      confirmText: "نعم، احفظ",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const codeName = resolveDeviceName(patch);
    if (!codeName) return;

    const typeLabel = patch.typeLabel || typeLabelFromType(patch.type);
    saveCustomDeviceType({ type: patch.type, typeLabel });
    const next = {
      name: codeName,
      type: patch.type,
      typeLabel,
      packageId: patch.packageId ?? detailDevice.packageId ?? null,
      isActive: patch.isActive,
      price: detailDevice.price || "—",
      notes: patch.notes ?? detailDevice.notes,
    };
    setDevicesList((list) =>
      list.map((d) => (d.id === detailDevice.id ? { ...d, ...next } : d)),
    );
    closeDeviceModal();
    zonesToastSuccess("تم حفظ التعديلات");
  };

  const handleDeviceSave = (patch) => {
    if (deviceModalMode === "add") return saveDeviceAdd(patch);
    return saveDeviceEdit(patch);
  };

  const toggleDeviceActive = async (row) => {
    const enabling = row.isActive === false;
    const confirmed = await zonesConfirm({
      title: enabling ? "تفعيل الجهاز؟" : "تعطيل الجهاز؟",
      text: enabling
        ? `«${row.name}» سيُفعَّل بعد التأكد من إتمام الصيانة.`
        : `«${row.name}» سيُعطَّل ويُرسل فوراً إلى موظف الصيانة.`,
      confirmText: enabling ? "تفعيل" : "تعطيل",
      cancelText: "تراجع",
    });
    if (!confirmed) return;

    if (enabling) {
      if (!tryEnableDevice(row.id)) return;
      setDevicesList(loadDevices());
      zonesToastSuccess("تم تفعيل الجهاز");
      return;
    }

    if (!disableDeviceFromManager(row, session?.fullName || "مدير الصالة")) return;
    setDevicesList(loadDevices());
    zonesToastSuccess("تم تعطيل الجهاز — يظهر في الأعطال النشطة للصيانة");
  };

  const archiveDevice = async (row) => {
    const confirmed = await zonesConfirm({
      title: "أرشفة الجهاز؟",
      text: `سيتم نقل «${row.name}» إلى الأرشيف.`,
      icon: "warning",
      confirmText: "أرشفة",
      cancelText: "تراجع",
    });
    if (!confirmed) return;
    setDevicesList((list) =>
      list.map((d) =>
        d.id === row.id
          ? { ...d, isArchived: true, archivedAt: formatFaultDateTime(), isActive: false }
          : d,
      ),
    );
    if (detailDevice?.id === row.id) {
      setDeviceDetailOpen(false);
      setDetailDevice(null);
    }
    zonesToastSuccess("تمت الأرشفة");
  };

  const openAddPackage = () => {
    setDetailPackage(null);
    setPackageModalMode("add");
    setPackageDetailOpen(true);
  };

  const openEditPackage = (row) => {
    setDetailPackage({ ...row });
    setPackageModalMode("edit");
    setPackageDetailOpen(true);
  };

  const openPackageDetail = (row) => {
    setDetailPackage({ ...row });
    setPackageModalMode("details");
    setPackageDetailOpen(true);
  };

  const closePackageModal = () => {
    setPackageDetailOpen(false);
    setDetailPackage(null);
    setPackageModalMode("details");
  };

  const savePackageAdd = async (patch) => {
    const confirmed = await zonesConfirm({
      title: "هل تريد حفظ الباقة؟",
      confirmText: "نعم، احفظ",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const nid = Math.max(0, ...packagesList.map((p) => p.id)) + 1;
    setPackagesList((list) => [
      ...list,
      {
        id: nid,
        name: patch.name,
        price: patch.price || "—",
        hours: patch.hours || "—",
        deviceLabel: patch.deviceLabel || "—",
        description: patch.description || "",
        notes: patch.notes || "",
        isActive: patch.isActive,
        createdAt: formatFaultDateTime(),
      },
    ]);
    closePackageModal();
    zonesToastSuccess("تم الحفظ");
  };

  const savePackageEdit = async (patch) => {
    if (!detailPackage) return;
    const confirmed = await zonesConfirm({
      title: "هل تريد حفظ التعديلات؟",
      confirmText: "نعم، احفظ",
      cancelText: "إلغاء",
    });
    if (!confirmed) return;

    const next = {
      name: patch.name || detailPackage.name,
      price: patch.price || "—",
      hours: patch.hours || "—",
      deviceLabel: patch.deviceLabel || "—",
      description: patch.description || "",
      notes: patch.notes || "",
      isActive: patch.isActive,
    };
    setPackagesList((list) =>
      list.map((p) => (p.id === detailPackage.id ? { ...p, ...next } : p)),
    );
    closePackageModal();
    zonesToastSuccess("تم حفظ التعديلات");
  };

  const handlePackageSave = (patch) => {
    if (packageModalMode === "add") return savePackageAdd(patch);
    return savePackageEdit(patch);
  };

  const togglePackageActive = async (row) => {
    const enabling = row.isActive === false;
    const confirmed = await zonesConfirm({
      title: enabling ? "تفعيل الباقة؟" : "تعطيل الباقة؟",
      text: enabling
        ? `«${row.name}» ستُفعَّل وتظهر للزبائن والأجهزة.`
        : `«${row.name}» ستُعطَّل ولن تظهر في القوائم.`,
      confirmText: enabling ? "تفعيل" : "تعطيل",
      cancelText: "تراجع",
    });
    if (!confirmed) return;
    setPackagesList((list) =>
      list.map((p) => (p.id === row.id ? { ...p, isActive: enabling } : p)),
    );
    zonesToastSuccess(enabling ? "تم تفعيل الباقة" : "تم تعطيل الباقة");
  };

  const archivePackage = async (row) => {
    const confirmed = await zonesConfirm({
      title: "أرشفة الباقة؟",
      text: `سيتم نقل «${row.name}» إلى الأرشيف.`,
      icon: "warning",
      confirmText: "أرشفة",
      cancelText: "تراجع",
    });
    if (!confirmed) return;
    setPackagesList((list) =>
      list.map((p) =>
        p.id === row.id
          ? { ...p, isArchived: true, archivedAt: formatFaultDateTime(), isActive: false }
          : p,
      ),
    );
    if (detailPackage?.id === row.id) closePackageModal();
    zonesToastSuccess("تمت الأرشفة");
  };

  return (
    <ManagerLayout>
      <PageHeader
        title={tab === "devices" ? "إدارة الأجهزة" : "إدارة الباقات"}
        description={
          tab === "devices"
            ? "إدارة أجهزة الصالة — الأرشيف من قائمة إدارة الصالة."
            : "إدارة باقات الصالة — الأرشيف من قائمة إدارة الصالة."
        }
      />

      {tab === "devices" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="إجمالي الأجهزة" value={deviceStats.total} icon={Gamepad2} />
            <KpiCard label="أجهزة سليمة" value={deviceStats.healthy} icon={CircleCheck} tone="green" />
            <KpiCard
              label="في الصيانة"
              value={deviceStats.inMaintenance}
              icon={Power}
              tone="amber"
              hint="نفس العدد في لوحة موظف الصيانة"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة الأجهزة</h2>
              <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
                {filteredDevices.length} جهاز
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <SearchBar
                value={deviceSearch}
                onChange={setDeviceSearch}
                placeholder="بحث عن جهاز..."
              />
              <Button size="sm" onClick={openAddDevice}>
                + إضافة جهاز جديد
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-3 py-2.5 font-bold">رقم الجهاز</th>
                    <th className="px-3 py-2.5 font-bold">نوع الجهاز</th>
                    <th className="px-3 py-2.5 font-bold">الباقة التابعة</th>
                    <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>
                    <th className="px-3 py-2.5 font-bold">آخر صيانة</th>
                    <th className="px-3 py-2.5 font-bold">الصيانة</th>
                    <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pageDevices.map((row) => {
                    const syncedRow = syncedDevices.find((d) => d.id === row.id) || row;
                    return (
                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100" dir="ltr">
                        {row.name}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.typeLabel}</td>
                      <td className="px-3 py-3 font-semibold text-[#6B5478] dark:text-[#c4a8d4]">
                        {getDevicePackageLabel(row.packageId, packagesList)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {formatDisplayDate(row.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {getDeviceLastMaintenance(row.id)}
                      </td>
                      <td className="px-3 py-3">
                        <DeviceMaintenanceStatusControl
                          device={{ ...syncedRow, isActive: row.isActive }}
                          managerName={session?.fullName || "مدير الصالة"}
                          onChanged={refreshDevicesFromStorage}
                        />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <TableRowActions
                          onDetails={() => openDeviceDetail(row)}
                          onEdit={() => openEditDevice(row)}
                          onToggleActive={() => toggleDeviceActive(row)}
                          active={row.isActive}
                          onArchive={() => archiveDevice(row)}
                        />
                      </td>
                    </tr>
                    );
                  })}
                  {pageDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                        لا توجد أجهزة مطابقة.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={devicePage}
              totalPages={deviceTotalPages}
              totalItems={filteredDevices.length}
              pageSize={PAGE_SIZE}
              onPageChange={setDevicePage}
            />
          </section>
        </div>
      ) : null}

      {tab === "packages" ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="إجمالي الباقات" value={packageStats.total} icon={Package} />
            <KpiCard label="باقات مفعّلة" value={packageStats.active} icon={CircleCheck} tone="green" />
            <KpiCard label="باقات معطّلة" value={packageStats.inactive} icon={Power} tone="amber" />
          </div>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة الباقات</h2>
              <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
                {filteredPackages.length} باقة
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
              <SearchBar
                value={packageSearch}
                onChange={setPackageSearch}
                placeholder="بحث عن باقة..."
              />
              <Button size="sm" onClick={openAddPackage}>
                + إضافة باقة جديدة
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <th className="px-3 py-2.5 font-bold">اسم الباقة</th>
                    <th className="px-3 py-2.5 font-bold">المدة</th>
                    <th className="px-3 py-2.5 font-bold">السعر</th>
                    <th className="px-3 py-2.5 font-bold">جهاز مستخدم</th>
                    <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>
                    <th className="px-3 py-2.5 font-bold">الحالة</th>
                    <th className={TABLE_ACTIONS_TH}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pagePackages.map((row) => (
                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.hours}</td>
                      <td className="px-3 py-3 font-bold text-[#6B5478]">{row.price}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.deviceLabel}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">
                        {formatDisplayDate(row.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={row.isActive !== false} />
                      </td>
                      <td className={TABLE_ACTIONS_TD}>
                        <PackageTableRowActions
                          onDetails={() => openPackageDetail(row)}
                          onEdit={() => openEditPackage(row)}
                          onToggleActive={() => togglePackageActive(row)}
                          active={row.isActive}
                          onArchive={() => archivePackage(row)}
                        />
                      </td>
                    </tr>
                  ))}
                  {pagePackages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                        لا توجد باقات مطابقة.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={packagePage}
              totalPages={packageTotalPages}
              totalItems={filteredPackages.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPackagePage}
            />
          </section>
        </div>
      ) : null}

      <DeviceDetailsModal
        open={deviceDetailOpen}
        mode={deviceModalMode}
        device={detailDevice}
        packages={packagesList}
        devices={devicesList}
        onClose={closeDeviceModal}
        onSave={handleDeviceSave}
        lastMaintenance={detailDevice ? getDeviceLastMaintenance(detailDevice.id) : "—"}
      />

      <PackageDetailsModal
        open={packageDetailOpen}
        mode={packageModalMode}
        pkg={detailPackage}
        onClose={closePackageModal}
        onSave={handlePackageSave}
      />
    </ManagerLayout>
  );
}
