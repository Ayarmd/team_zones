import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation } from "react-router-dom";

import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import TablePagination from "../../../shared/components/TablePagination";

import {

  DEVICES_STORAGE_EVENT,

  getDevicePackageLabel,

} from "../../devices-packages/data/devicesStorage";

import { getDeviceSessionsThisMonth } from "../../devices-packages/data/deviceSessionsStorage";

import { loadPackages, PACKAGES_STORAGE_EVENT } from "../../devices-packages/data/packagesStorage";

import { DeviceOperationalStatusBadge } from "../../devices-packages/utils/deviceOperationalStatus";

import {

  isDeviceBroken,

  loadSyncedActiveDevices,

} from "../../devices-packages/utils/deviceFaultSync";

import {

  getLatestPendingFaultForDevice,

  MAINTENANCE_FAULTS_EVENT,

} from "../../maintenance/data/maintenanceFaultsStorage";

import { faultTypeLabel, formatDisplayDate } from "../../maintenance/data/faultMeta";

import { useReceptionEmployeeRoutes } from "../data/receptionEmployeeRoutes";



const PAGE_SIZE = 8;



const VIEW_META = {

  all: {

    title: "جميع الأجهزة",

    empty: "لا توجد أجهزة مطابقة.",

  },

  broken: {

    title: "الأجهزة المعطلة",

    empty: "لا توجد أجهزة معطلة حالياً.",

  },

};



function resolveView(pathname, devicesBrokenPath) {
  if (pathname === devicesBrokenPath) return "broken";
  return "all";
}



function FaultStateBadge({ underMaintenance }) {

  return (

    <span

      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${

        underMaintenance

          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"

          : "bg-red-500/15 text-red-600 dark:text-red-400"

      }`}

    >

      {underMaintenance ? "تحت الصيانة" : "معطّل"}

    </span>

  );

}



export default function ReceptionDevicesPage() {
  const location = useLocation();
  const { routes } = useReceptionEmployeeRoutes();
  const view = resolveView(location.pathname, routes.devicesBroken);

  const meta = VIEW_META[view];



  const [devices, setDevices] = useState(() => loadSyncedActiveDevices());

  const [packages, setPackages] = useState(() => loadPackages());

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);



  const refresh = useCallback(() => setDevices(loadSyncedActiveDevices()), []);

  const refreshPackages = useCallback(() => setPackages(loadPackages()), []);



  useEffect(() => {

    refresh();

    refreshPackages();

  }, [location.pathname, refresh, refreshPackages]);



  useEffect(() => {

    refresh();

    refreshPackages();

    window.addEventListener(DEVICES_STORAGE_EVENT, refresh);

    window.addEventListener(PACKAGES_STORAGE_EVENT, refreshPackages);

    window.addEventListener(MAINTENANCE_FAULTS_EVENT, refresh);

    window.addEventListener("focus", refresh);

    return () => {

      window.removeEventListener(DEVICES_STORAGE_EVENT, refresh);

      window.removeEventListener(PACKAGES_STORAGE_EVENT, refreshPackages);

      window.removeEventListener(MAINTENANCE_FAULTS_EVENT, refresh);

      window.removeEventListener("focus", refresh);

    };

  }, [refresh, refreshPackages]);



  useEffect(() => {

    setPage(1);

  }, [search, view]);



  const filtered = useMemo(() => {

    let list = devices;

    if (view === "broken") {

      list = list.filter(isDeviceBroken);

    }

    const q = search.trim().toLowerCase();

    if (!q) return list;

    return list.filter(

      (d) =>

        d.name.toLowerCase().includes(q) ||

        (d.typeLabel || "").toLowerCase().includes(q) ||

        getDevicePackageLabel(d.packageId, packages).toLowerCase().includes(q),

    );

  }, [devices, packages, search, view]);



  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  useEffect(() => {

    if (page > totalPages) setPage(totalPages);

  }, [page, totalPages]);



  return (

    <div className="space-y-4" dir="rtl">

      <PageHeader title={meta.title} />



      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">

          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">{meta.title}</h2>

          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">

            {filtered.length} جهاز

          </span>

        </div>



        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">

          <SearchBar value={search} onChange={setSearch} placeholder="بحث عن جهاز..." />

        </div>



        <div className="overflow-x-auto">

          {view === "all" ? (

            <table className="w-full min-w-[880px] text-right text-xs">

              <thead>

                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">

                  <th className="px-3 py-2.5 font-bold">اسم الجهاز</th>

                  <th className="px-3 py-2.5 font-bold">نوع الجهاز</th>

                  <th className="px-3 py-2.5 font-bold">الباقة المربوطة</th>

                  <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>

                  <th className="px-3 py-2.5 font-bold">جلسات هذا الشهر</th>

                  <th className="px-3 py-2.5 font-bold">الحالة</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                {paged.length === 0 ? (

                  <tr>

                    <td colSpan={6} className="px-3 py-10 text-center text-gray-400">

                      {meta.empty}

                    </td>

                  </tr>

                ) : (

                  paged.map((row) => (

                    <tr

                      key={row.id}

                      className={isDeviceBroken(row) ? "bg-red-50/20 dark:bg-red-950/10" : ""}

                    >

                      <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>

                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.typeLabel}</td>

                      <td className="px-3 py-3 font-semibold text-[#6B5478] dark:text-[#c4b5d0]">

                        {getDevicePackageLabel(row.packageId, packages)}

                      </td>

                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">

                        {formatDisplayDate(row.createdAt)}

                      </td>

                      <td className="px-3 py-3 font-bold tabular-nums text-gray-700 dark:text-gray-200">

                        {getDeviceSessionsThisMonth(row.id, row)}

                      </td>

                      <td className="px-3 py-3">

                        <DeviceOperationalStatusBadge device={row} />

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          ) : (

            <table className="w-full min-w-[900px] text-right text-xs">

              <thead>

                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">

                  <th className="px-3 py-2.5 font-bold">اسم الجهاز</th>

                  <th className="px-3 py-2.5 font-bold">نوع الجهاز</th>

                  <th className="px-3 py-2.5 font-bold">الباقة المربوطة</th>

                  <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>

                  <th className="px-3 py-2.5 font-bold">نوع العطل</th>

                  <th className="px-3 py-2.5 font-bold">تاريخ العطل</th>

                  <th className="px-3 py-2.5 font-bold">الحالة</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                {paged.length === 0 ? (

                  <tr>

                    <td colSpan={7} className="px-3 py-10 text-center text-gray-400">

                      {meta.empty}

                    </td>

                  </tr>

                ) : (

                  paged.map((row) => {

                    const fault = getLatestPendingFaultForDevice(row.id);

                    const underMaintenance = Boolean(row.maintenanceInProgress);

                    return (

                      <tr

                        key={row.id}

                        className="bg-red-50/30 dark:bg-red-950/10"

                      >

                        <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>

                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.typeLabel}</td>

                        <td className="px-3 py-3 font-semibold text-[#6B5478] dark:text-[#c4b5d0]">

                          {getDevicePackageLabel(row.packageId, packages)}

                        </td>

                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">

                          {formatDisplayDate(row.createdAt)}

                        </td>

                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300">

                          {fault ? faultTypeLabel(fault.faultType, fault.faultTypeCustom) : "—"}

                        </td>

                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">

                          {formatDisplayDate(fault?.createdAt)}

                        </td>

                        <td className="px-3 py-3">

                          <FaultStateBadge underMaintenance={underMaintenance} />

                        </td>

                      </tr>

                    );

                  })

                )}

              </tbody>

            </table>

          )}

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

  );

}


