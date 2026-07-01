import { useEffect, useMemo, useState } from "react";

import {

  CheckCircle2,

  ChevronLeft,

  ChevronRight,

  Clock,

  Eye,

  XCircle,

} from "lucide-react";

import { zonesSwal, zonesToastError, zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import { showInviteRegistrationLink } from "../../../shared/utils/showInviteRegistrationLink";

import {

  acceptHallJoinRequest,

  fetchHallJoinRequests,

  rejectHallJoinRequest,

} from "../data/hallJoinRequestsApi";

import { HALL_REQUEST_STATUS } from "../data/hallRequestStatus";

import HallRequestDetailsModal from "../components/HallRequestDetailsModal";

import AcceptHallRequestModal from "../components/AcceptHallRequestModal";

import RejectHallRequestModal from "../components/RejectHallRequestModal";

import IconGlyph from "../../../shared/components/ui/IconGlyph";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import { TABLE_ACTIONS_TD, TABLE_ACTIONS_TH } from "../../../shared/components/ui/tableActionStyles";
import {
  TableSelectionModeBar,
  TableSelectHeaderCell,
  TableSelectRowCell,
  selectableRowClass,
} from "../../../shared/components/ui/TableSelection";
import {
  filterItemsByIds,
  resolveBulkActionIds,
  tableSelectColSpan,
} from "../../../shared/hooks/useTableSelection";
import { useTableSelectionMode } from "../../../shared/hooks/useTableSelectionMode";
import { cn } from "../../../lib/utils";



const PAGE_SIZE = 4;
const TABLE_DATA_COLS = 5;

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



function showAcceptEmailPreview() {
  // email is sent silently by the server — no popup needed
}



function showRejectEmailPreview() {
  // rejection email is sent silently by the server — no popup needed
}



export default function PendingRequestsPage() {

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [detailsReq, setDetailsReq] = useState(null);

  const [acceptReq, setAcceptReq] = useState(null);

  const [rejectReq, setRejectReq] = useState(null);

  const [page, setPage] = useState(1);

  const [activeFilter, setActiveFilter] = useState("pending");



  useEffect(() => {

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await fetchHallJoinRequests();
      if (cancelled) return;
      if (result.ok) {
        setRequests(result.requests);
      } else {
        zonesToastError(result.error || "تعذر تحميل الطلبات");
      }
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };

  }, []);



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

  const pageIds = useMemo(() => pageRequests.map((r) => r.id), [pageRequests]);
  const allIds = useMemo(() => filteredRequests.map((r) => r.id), [filteredRequests]);
  const selection = useTableSelectionMode({ items: filteredRequests, pageIds, allIds });

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

    const result = await acceptHallJoinRequest(acceptReq.id, formData);

    if (!result.ok) {

      zonesToastError(result.error || "تعذر قبول الطلب");

      return;

    }

    setRequests((prev) =>
      prev.map((r) => (r.id === result.request.id ? result.request : r)),
    );

    setAcceptReq(null);
    selection.exitSelectionMode();

    if (result.registrationUrl) {
      await showInviteRegistrationLink({
        title: "رابط تسجيل المدير",
        recipientEmail: result.request.managerEmail,
        registerLink: result.registrationUrl,
        mailSent: result.mailSent,
      });
    } else if (result.mailError) {
      zonesToastError(`تعذر إرسال البريد: ${result.mailError.slice(0, 120)}`);
    } else {
      zonesToastSuccess(`تم قبول الطلب`);
    }

  };



  const handleRejectSubmit = async (reason) => {

    if (!rejectReq) return;

    const result = await rejectHallJoinRequest(rejectReq.id, reason);

    if (!result.ok) {

      zonesToastError(result.error || "تعذر رفض الطلب");

      return;

    }

    setRequests((prev) =>
      prev.map((r) => (r.id === result.request.id ? result.request : r)),
    );

    setRejectReq(null);
    selection.exitSelectionMode();

    zonesToastSuccess(`تم رفض الطلب وإرسال إشعار إلى ${result.request.managerEmail}`);
    showRejectEmailPreview();

  };

  const handleBulkReject = async () => {
    const targets = filterItemsByIds(filteredRequests, selection.selectedIds).filter(
      (r) => r.status === HALL_REQUEST_STATUS.pending,
    );
    if (!targets.length) return;

    const res = await zonesSwal({
      title: `رفض ${targets.length} طلبات؟`,
      input: "text",
      inputLabel: "سبب الرفض",
      inputValue: "رفض إداري",
      showCancelButton: true,
      confirmButtonText: "رفض",
      cancelButtonText: "إلغاء",
    });
    if (!res.isConfirmed) return;

    let success = 0;
    for (const req of targets) {
      const result = await rejectHallJoinRequest(req.id, res.value);
      if (result.ok) {
        success += 1;
        setRequests((prev) => prev.map((r) => (r.id === result.request.id ? result.request : r)));
      }
    }

    selection.exitSelectionMode();
    if (success) zonesToastSuccess(`تم رفض ${success} من ${targets.length} طلبات`);
  };

  const openRejectBulk = (req) => {
    const targetIds = resolveBulkActionIds(req.id, selection.selectedIds);
    const pendingTargets = filterItemsByIds(filteredRequests, targetIds).filter(
      (r) => r.status === HALL_REQUEST_STATUS.pending,
    );
    if (!pendingTargets.length) return;
    if (pendingTargets.length > 1) {
      handleBulkReject();
      return;
    }
    openReject(pendingTargets[0]);
  };

  const bulkActions =
    activeFilter === "pending"
      ? [{ label: "رفض المحدد", icon: XCircle, onClick: handleBulkReject, variant: "danger" }]
      : [];



  return (

    <div className="space-y-6">

      {loading ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">جاري تحميل الطلبات...</p>
      ) : null}

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

        <TableSelectionModeBar
          selectionMode={selection.selectionMode}
          onEnter={selection.enterSelectionMode}
          onExit={selection.exitSelectionMode}
          count={selection.count}
          totalCount={filteredRequests.length}
          onClear={selection.clearSelection}
          actions={bulkActions}
        />

        <div className="overflow-x-auto">

          <table className="w-full min-w-[600px] text-right text-xs">

            <thead>

              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">

                <TableSelectHeaderCell {...selection} />

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

                  <tr key={r.id} className={selection.selectionMode ? selectableRowClass(selection.isSelected(r.id)) : undefined}>

                    <TableSelectRowCell id={r.id} ariaLabel={`تحديد ${r.hallName}`} {...selection} />

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

                              label={
                                selection.isSelected(r.id) && selection.count > 1
                                  ? `رفض ${selection.count} طلبات`
                                  : "رفض"
                              }

                              tone="danger"

                              onClick={() => openRejectBulk(r)}

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

                  <td colSpan={tableSelectColSpan(TABLE_DATA_COLS, selection.selectionMode)} className="px-3 py-10 text-center text-gray-400">

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

