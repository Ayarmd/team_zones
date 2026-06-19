import { MessageSquare, Star, Trash2 } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import Button from "../../super-admin/components/ui/Button";
import {
  customerInitials,
  formatRelativeTime,
} from "../data/customerCommentsStorage";

function RatingStars({ rating }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5" aria-label={`تقييم ${rating} من 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
        />
      ))}
    </div>
  );
}

export default function CustomerCommentCard({ comment, onReply, onDelete }) {
  const hasReply = Boolean(comment.managerReply?.text);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#6B5478]/25 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-[#6B5478]/35">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6B5478] to-[#836a90] text-sm font-extrabold text-white shadow-sm">
          {customerInitials(comment.customerName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                {comment.customerName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                <span className="rounded-full bg-[#6B5478]/10 px-2 py-0.5 text-[10px] font-bold text-[#6B5478]">
                  تطبيق الزبون
                </span>
                <RatingStars rating={comment.rating} />
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                hasReply
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
              }`}
            >
              {hasReply ? "تم الرد" : "بانتظار الرد"}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            {comment.text}
          </p>

          {hasReply ? (
            <div className="mt-4 rounded-xl border border-[#6B5478]/15 bg-[#6B5478]/5 p-3 dark:border-[#6B5478]/25 dark:bg-[#6B5478]/10">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <MessageSquare size={13} className="text-[#6B5478]" />
                <span className="text-[11px] font-extrabold text-[#6B5478]">رد الصالة</span>
                <span className="text-[10px] text-gray-400">
                  {formatRelativeTime(comment.managerReply.repliedAt)}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                {comment.managerReply.text}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant={hasReply ? "outline" : "primary"} onClick={() => onReply(comment)}>
              <MessageSquare className="h-3.5 w-3.5" />
              {hasReply ? "تعديل الرد" : "رد"}
            </Button>
            <IconButton
              icon={Trash2}
              label="حذف التعليق"
              tone="danger"
              onClick={() => onDelete(comment)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
