import { useEffect, useMemo, useState } from "react";

import {

  CheckCircle2,

  ChevronLeft,

  ChevronRight,

  Clock,

  Eye,

  XCircle,

} from "lucide-react";

import { zonesSwal, zonesToastError } from "../../../shared/utils/zonesAlerts";
import { cn } from "../../../lib/utils";

import {

  acceptHallRequestWithInvitation,

  getSuperAdminState,

  rejectHallRequestWithReason,

} from "../data/superAdminStorage";

import { HALL_REQUEST_STATUS } from "../data/hallRequestStatus";

import HallRequestDetailsModal from "../components/HallRequestDetailsModal";

import AcceptHallRequestModal from "../components/AcceptHallRequestModal";

import RejectHallRequestModal from "../components/RejectHallRequestModal";

import IconGlyph from "../../../shared/components/ui/IconGlyph";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";



const PAGE_SIZE = 4;

const REQUEST_FILTERS = {
  pending: {
    label: "الطلبات المعلقة",
    tableTitle: "قائمة الطلبات المعلقة",
  },
  approved: {
    label: "تمت الموافقة هذا الشهر",
    tableTitle: "قائمة الطلبات المقبولة هذا الشهر",
  },
  rejected: {
    label: "تم الرفض هذا الشهر",
    tableTitle: "قائمة الطلبات المرفوضة هذا الشهر",
  },
};

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const [y, m] = String(dateStr).slice(0, 10).split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m === now.getMonth() + 1;
}

function matchesRequestFilter(request, filterKey) {
  if (filterKey === "pending") {
    return request.status === HALL_REQUEST_STATUS.pending;
  }
  if (filterKey === "approved") {
    return (
      request.status === HALL_REQUEST_STATUS.accepted &&
      isThisMonth(request.acceptedAt || request.submittedAt)
    );
  }
  if (filterKey === "rejected") {
    return (
      request.status === HALL_REQUEST_STATUS.rejected &&
      isThisMonth(request.rejectedAt || request.submittedAt)
    );
  }
  return true;
}

function FilterStatCard({ icon: Icon, iconTone = "primary", label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-5 text-right shadow-sm transition",
        active
          ? "border-[#6B5478] bg-[#6B5478]/10 ring-2 ring-[#6B5478]/25"
          : "border-gray-200 bg-white hover:border-[#6B5478]/35 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-[#6B5478]/45",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon ? <IconGlyph icon={Icon} tone={iconTone} size={20} /> : null}
      </div>
    </button>
  );
}



function showAcceptEmailPreview(req, registrationUrl) {

  return zonesSwal({

    icon: "success",

    title: "تم قبول الطلب وإرسال الدعوة ✅",

    html: `

      <div style="text-align:right;direction:rtl;font-size:12px;line-height:1.85;color:#374151">

        <p style="margin:0 0 10px;font-weight:700;color:#111827">📧 معاينة البريد المرسل للمدير</p>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;text-align:right">

          <p style="margin:0 0 8px;font-size:11px;color:#6b7280">العنوان:</p>

          <p style="margin:0 0 12px;font-weight:800;color:#6B5478">تم قبول طلب انضمام صالتك</p>

          <p style="margin:0 0 6px">مرحبًا <strong>${req.managerName}</strong></p>

          <p style="margin:0 0 10px">تمت الموافقة على طلب انضمام صالتكم <strong>${req.hallName}</strong> إلى منصة Zones.</p>

          <p style="margin:0 0 8px">لإكمال إنشاء حساب مدير الصالة يرجى الضغط على الرابط التالي:</p>

          <p style="margin:0 0 10px"><a href="${registrationUrl}" style="color:#6B5478;font-weight:700">إكمال التسجيل</a></p>

          <p style="margin:0;font-size:11px;color:#9ca3af">الرابط صالح لمدة 24 ساعة.</p>

        </div>

        <p style="margin:12px 0 6px;font-size:11px">المستلم: <span dir="ltr">${req.managerEmail}</span></p>

        <input id="zones-reg-link" value="${registrationUrl}" readonly

          style="width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:10px;font-size:11px;direction:ltr;text-align:left;background:#fff;margin-top:6px" />

      </div>`,

    confirmButtonText: "نسخ الرابط وإغلاق",

    didOpen: () => {

      document.getElementById("zones-reg-link")?.select();

    },

    preConfirm: () => {

      try {

        navigator.clipboard?.writeText(registrationUrl);

      } catch {

        /* ignore */

      }

    },

  });

}



function showRejectEmailPreview(req, reason) {

  return zonesSwal({

    icon: "info",

    title: "تم رفض الطلب وإرسال الإشعار",

    html: `

      <div style="text-align:right;direction:rtl;font-size:12px;line-height:1.85;color:#374151">

        <p style="margin:0 0 10px;font-weight:700;color:#111827">📧 معاينة البريد المرسل للمدير</p>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;text-align:right">

          <p style="margin:0 0 8px;font-size:11px;color:#6b7280">العنوان:</p>

          <p style="margin:0 0 12px;font-weight:800;color:#dc2626">تم رفض طلب انضمام الصالة</p>

          <p style="margin:0 0 6px">مرحبًا <strong>${req.managerName}</strong></p>

          <p style="margin:0 0 10px">نعتذر، تم رفض طلب انضمام صالتكم <strong>${req.hallName}</strong> إلى منصة Zones.</p>

          <p style="margin:0 0 4px;font-weight:700">سبب الرفض:</p>

          <p style="margin:0 0 10px;padding:8px;background:#fef2f2;border-radius:8px;color:#991b1b">${reason}</p>

          <p style="margin:0;font-size:11px;color:#6b7280">يمكنكم تعديل البيانات وإعادة التقديم لاحقًا.</p>

        </div>

        <p style="margin:12px 0 0;font-size:11px">المستلم: <span dir="ltr">${req.managerEmail}</span></p>

      </div>`,

    confirmButtonText: "تم",

  });

}



export default function PendingRequestsPage() {

  const [state, setState] = useState(getSuperAdminState());

  const [detailsReq, setDetailsReq] = useState(null);

  const [acceptReq, setAcceptReq] = useState(null);

  const [rejectReq, setRejectReq] = useState(null);

  const [page, setPage] = useState(1);

  const [activeFilter, setActiveFilter] = useState("pending");



  useEffect(() => {

    const refresh = () => setState(getSuperAdminState());

    refresh();

    window.addEventListener("super-admin-data-updated", refresh);

    return () => window.removeEventListener("super-admin-data-updated", refresh);

  }, []);



  const requests = state.pendingRequests;

  const filterCounts = useMemo(
    () => ({
      pending: requests.filter((r) => matchesRequestFilter(r, "pending")).length,
      approved: requests.filter((r) => matchesRequestFilter(r, "approved")).length,
      rejected: requests.filter((r) => matchesRequestFilter(r, "rejected")).length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(
    () => requests.filter((r) => matchesRequestFilter(r, activeFilter)),
    [requests, activeFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));

  const pageRequests = useMemo(
    () => filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRequests, page],
  );

  const rangeFrom = filteredRequests.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const rangeTo = Math.min(page * PAGE_SIZE, filteredRequests.length);

  const selectFilter = (filterKey) => {
    setActiveFilter(filterKey);
    setPage(1);
  };



  const openAccept = (req) => {

    if (req.status !== HALL_REQUEST_STATUS.pending) return;

    setDetailsReq(null);

    setAcceptReq(req);

  };



  const openReject = (req) => {

    if (req.status !== HALL_REQUEST_STATUS.pending) return;

    setDetailsReq(null);

    setRejectReq(req);

  };



  const handleAcceptSubmit = async (formData) => {

    if (!acceptReq) return;

    const result = acceptHallRequestWithInvitation(acceptReq.id, formData);

    if (!result.ok) {

      zonesToastError(result.error || "تعذر قبول الطلب");

      return;

    }

    setAcceptReq(null);

    await showAcceptEmailPreview(result.request, result.registrationUrl);

  };



  const handleRejectSubmit = async (reason) => {

    if (!rejectReq) return;

    const result = rejectHallRequestWithReason(rejectReq.id, reason);

    if (!result.ok) {

      zonesToastError(result.error || "تعذر رفض الطلب");

      return;

    }

    setRejectReq(null);

    await showRejectEmailPreview(result.request, reason);

  };



  return (

    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-3">

        <FilterStatCard

          icon={Clock}

          iconTone="amber"

          label={REQUEST_FILTERS.pending.label}

          value={filterCounts.pending}

          active={activeFilter === "pending"}

          onClick={() => selectFilter("pending")}

        />

        <FilterStatCard

          icon={CheckCircle2}

          iconTone="green"

          label={REQUEST_FILTERS.approved.label}

          value={filterCounts.approved}

          active={activeFilter === "approved"}

          onClick={() => selectFilter("approved")}

        />

        <FilterStatCard

          icon={XCircle}

          iconTone="red"

          label={REQUEST_FILTERS.rejected.label}

          value={filterCounts.rejected}

          active={activeFilter === "rejected"}

          onClick={() => selectFilter("rejected")}

        />

      </div>



      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">

          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">

            {REQUEST_FILTERS[activeFilter].tableTitle}

          </h2>

          <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">

            {filteredRequests.length} طلب

          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[600px] text-right text-xs">

            <thead>

              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">

                <th className="px-3 py-2.5 font-bold">اسم الصالة</th>

                <th className="px-3 py-2.5 font-bold">المدينة</th>

                <th className="px-3 py-2.5 font-bold">الهاتف التجاري</th>

                <th className="px-3 py-2.5 font-bold">تاريخ الطلب</th>

                <th className={TABLE_ACTIONS_TH}>الإجراءات</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {pageRequests.map((r) => {

                const isPending = r.status === HALL_REQUEST_STATUS.pending;

                return (

                  <tr key={r.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">

                    <td className="px-3 py-3 font-bold text-gray-800 dark:text-gray-100">{r.hallName}</td>

                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{r.city}</td>

                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">{r.commercialPhone}</td>

                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300" dir="ltr">

                      {r.submittedAt?.replaceAll("-", "/")}

                    </td>

                    <td className={TABLE_ACTIONS_TD}>

                      <TableActionsGroup>

                        <IconButton

                          icon={Eye}

                          label="عرض التفاصيل"

                          tone="brand"

                          onClick={() => setDetailsReq(r)}

                        />

                        {isPending ? (

                          <>

                            <IconButton

                              icon={CheckCircle2}

                              label="قبول"

                              tone="success"

                              onClick={() => openAccept(r)}

                            />

                            <IconButton

                              icon={XCircle}

                              label="رفض"

                              tone="danger"

                              onClick={() => openReject(r)}

                            />

                          </>

                        ) : null}

                      </TableActionsGroup>

                    </td>

                  </tr>

                );

              })}

              {pageRequests.length === 0 ? (

                <tr>

                  <td colSpan={5} className="px-3 py-10 text-center text-gray-400">

                    لا توجد طلبات في هذه الفئة.

                  </td>

                </tr>

              ) : null}

            </tbody>

          </table>

        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800">

          <p className="text-[11px] text-gray-500">

            عرض {rangeFrom} - {rangeTo} من {filteredRequests.length} طلب

          </p>

          <div className="flex items-center gap-1">

            <IconButton

              icon={ChevronRight}

              label="الصفحة السابقة"

              size={14}

              disabled={page === 1}

              onClick={() => setPage((p) => Math.max(1, p - 1))}

            />

            {Array.from({ length: totalPages }).map((_, i) => (

              <button

                key={i}

                onClick={() => setPage(i + 1)}

                className={`h-7 w-7 rounded-lg text-[11px] font-bold ${

                  page === i + 1

                    ? "bg-[#6B5478] text-white"

                    : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"

                }`}

              >

                {i + 1}

              </button>

            ))}

            <IconButton

              icon={ChevronLeft}

              label="الصفحة التالية"

              size={14}

              disabled={page === totalPages}

              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}

            />

          </div>

        </div>

      </section>



      <HallRequestDetailsModal

        request={detailsReq}

        onClose={() => setDetailsReq(null)}

        onAccept={openAccept}

        onReject={openReject}

      />



      <AcceptHallRequestModal

        request={acceptReq}

        onClose={() => setAcceptReq(null)}

        onSubmit={handleAcceptSubmit}

      />



      <RejectHallRequestModal

        request={rejectReq}

        onClose={() => setRejectReq(null)}

        onSubmit={handleRejectSubmit}

      />

    </div>

  );

}

