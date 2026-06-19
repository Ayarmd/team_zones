import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import { formatDisplayDate } from "../../maintenance/data/faultMeta";

import TablePagination from "../../../shared/components/TablePagination";

import {

  DEVICES_STORAGE_EVENT,

  getPrimaryDeviceNameForPackage,

  loadDevices,

} from "../../devices-packages/data/devicesStorage";

import { loadPackages } from "../../devices-packages/data/packagesStorage";

import { usePackagesSync } from "../../devices-packages/hooks/usePackagesSync";



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



export default function ReceptionPackagesPage() {

  const [packagesList, setPackagesList] = useState(() => loadPackages());

  const [devices, setDevices] = useState(() => loadDevices().filter((d) => !d.isArchived));

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);



  usePackagesSync(setPackagesList);



  useEffect(() => {

    const syncDevices = () => setDevices(loadDevices().filter((d) => !d.isArchived));

    syncDevices();

    window.addEventListener(DEVICES_STORAGE_EVENT, syncDevices);

    window.addEventListener("focus", syncDevices);

    return () => {

      window.removeEventListener(DEVICES_STORAGE_EVENT, syncDevices);

      window.removeEventListener("focus", syncDevices);

    };

  }, []);



  useEffect(() => {

    setPage(1);

  }, [search]);



  const filtered = useMemo(() => {

    const q = search.trim().toLowerCase();

    const activePackages = packagesList.filter((p) => !p.isArchived);

    if (!q) return activePackages;

    return activePackages.filter(

      (p) =>

        p.name.toLowerCase().includes(q) ||

        getPrimaryDeviceNameForPackage(p.id, devices).toLowerCase().includes(q) ||

        p.description?.toLowerCase().includes(q),

    );

  }, [packagesList, devices, search]);



  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  useEffect(() => {

    if (page > totalPages) setPage(totalPages);

  }, [page, totalPages]);



  return (

    <div className="space-y-4" dir="rtl">

      <PageHeader

        title="الباقات"

        description="باقات الصالة المضافة من المدير — مرتبطة بأجهزة الحجز."

      />



      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">

          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">قائمة الباقات</h2>

          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">

            {filtered.length} باقة

          </span>

        </div>



        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">

          <SearchBar value={search} onChange={setSearch} placeholder="بحث عن باقة..." />

        </div>



        <div className="overflow-x-auto">

          <table className="w-full min-w-[880px] text-right text-xs">

            <thead>

              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">

                <th className="px-3 py-2.5 font-bold">الباقات</th>

                <th className="px-3 py-2.5 font-bold">المدة</th>

                <th className="px-3 py-2.5 font-bold">السعر</th>

                <th className="px-3 py-2.5 font-bold">تاريخ الإضافة</th>

                <th className="px-3 py-2.5 font-bold">الحالة</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {paged.length === 0 ? (

                <tr>

                  <td colSpan={5} className="px-3 py-10 text-center text-gray-400">

                    لا توجد باقات مطابقة.

                  </td>

                </tr>

              ) : (

                paged.map((row) => {

                  const linkedDevice = getPrimaryDeviceNameForPackage(row.id, devices);

                  return (

                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">

                      <td className="px-3 py-3">

                        <p className="font-bold text-gray-800 dark:text-gray-100">{row.name}</p>

                        <p className="mt-0.5 text-[10px] font-semibold text-gray-400">

                          {linkedDevice !== "—" ? `الجهاز: ${linkedDevice}` : "بدون جهاز مربوط"}

                        </p>

                      </td>

                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{row.hours}</td>

                      <td className="px-3 py-3 font-bold text-[#6B5478]">{row.price}</td>

                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">

                        {formatDisplayDate(row.createdAt)}

                      </td>

                      <td className="px-3 py-3">

                        <StatusBadge active={row.isActive} />

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

    </div>

  );

}


