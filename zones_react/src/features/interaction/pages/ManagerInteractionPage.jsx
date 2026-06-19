import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, MessageSquare, MessagesSquare } from "lucide-react";
import ManagerLayout from "../../../shared/layouts/ManagerLayout";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import KpiCard from "../../super-admin/components/ui/KpiCard";
import TablePagination from "../../../shared/components/TablePagination";
import {
  zonesConfirm,
  zonesToastSuccess,
} from "../../../shared/utils/zonesAlerts";
import { getAuthSession } from "../../auth/data/mockUsersStorage";
import {
  CUSTOMER_COMMENTS_EVENT,
  deleteComment,
  getCommentStats,
  loadComments,
  replyToComment,
} from "../data/customerCommentsStorage";
import CustomerCommentCard from "../components/CustomerCommentCard";
import CommentReplyModal from "../components/CommentReplyModal";

const PAGE_SIZE = 4;

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار الرد" },
  { key: "replied", label: "تم الرد" },
];

export default function ManagerInteractionPage() {
  const session = getAuthSession();
  const managerName = session?.fullName || "مدير الصالة";

  const [comments, setComments] = useState(() => loadComments());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [replyComment, setReplyComment] = useState(null);
  const [replyText, setReplyText] = useState("");

  const refresh = useCallback(() => setComments(loadComments()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(CUSTOMER_COMMENTS_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(CUSTOMER_COMMENTS_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const stats = useMemo(() => getCommentStats(comments), [comments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comments.filter((c) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && !c.managerReply?.text) ||
        (filter === "replied" && Boolean(c.managerReply?.text));
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.text.toLowerCase().includes(q) ||
        (c.managerReply?.text || "").toLowerCase().includes(q)
      );
    });
  }, [comments, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openReply = (comment) => {
    setReplyComment(comment);
    setReplyText(comment.managerReply?.text || "");
  };

  const closeReply = () => {
    setReplyComment(null);
    setReplyText("");
  };

  const handleSaveReply = () => {
    if (!replyComment || !replyText.trim()) return;
    replyToComment(replyComment.id, replyText, managerName);
    refresh();
    closeReply();
    zonesToastSuccess(replyComment.managerReply?.text ? "تم تحديث الرد" : "تم إرسال الرد للزبون");
  };

  const handleDelete = async (comment) => {
    const confirmed = await zonesConfirm({
      title: "حذف التعليق؟",
      text: `سيتم حذف تعليق «${comment.customerName}» نهائياً من التطبيق.`,
      confirmText: "حذف",
      cancelText: "تراجع",
      danger: true,
    });
    if (!confirmed) return;
    deleteComment(comment.id);
    refresh();
    zonesToastSuccess("تم حذف التعليق");
  };

  return (
    <ManagerLayout>
      <div className="space-y-4" dir="rtl">
        <PageHeader
          title="تفاعل"
          description="تعليقات الزبائن من التطبيق — ردّ باحتراف أو احذف ما لا يناسب صالةك."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="إجمالي التعليقات"
            value={String(stats.total)}
            icon={MessagesSquare}
            tone="primary"
            hint="كل ما وصل من تطبيق الزبون"
          />
          <KpiCard
            label="بانتظار الرد"
            value={String(stats.pending)}
            icon={MessageCircle}
            tone="amber"
            hint="تحتاج ردك الآن"
          />
          <KpiCard
            label="تم الرد"
            value={String(stats.replied)}
            icon={MessageSquare}
            tone="green"
            hint="ردود منشورة في التطبيق"
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">تعليقات الزبائن</h2>
            </div>
            <span className="rounded-full bg-[#6B5478]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#6B5478]">
              {filtered.length} تعليق
            </span>
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar
              containerClassName="min-w-[220px] flex-1 max-w-md"
              value={search}
              onChange={setSearch}
              placeholder="بحث باسم الزبون أو نص التعليق..."
            />

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${
                      active
                        ? "bg-[#6B5478] text-white shadow-sm shadow-[#6B5478]/25"
                        : "bg-gray-100 text-gray-600 hover:bg-[#6B5478]/10 hover:text-[#6B5478] dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 p-5">
            {paged.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center dark:border-gray-700">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  {filter === "pending"
                    ? "لا توجد تعليقات بانتظار الرد."
                    : filter === "replied"
                      ? "لا توجد تعليقات مُرد عليها بعد."
                      : "لا توجد تعليقات مطابقة."}
                </p>
              </div>
            ) : (
              paged.map((comment) => (
                <CustomerCommentCard
                  key={comment.id}
                  comment={comment}
                  onReply={openReply}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

          {filtered.length > PAGE_SIZE ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          ) : null}
        </section>
      </div>

      <CommentReplyModal
        open={Boolean(replyComment)}
        comment={replyComment}
        replyText={replyText}
        onChange={setReplyText}
        onClose={closeReply}
        onSave={handleSaveReply}
      />
    </ManagerLayout>
  );
}
