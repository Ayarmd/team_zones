import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  CUSTOMER_COMMENTS_EVENT,
  formatRelativeTime,
  loadComments,
} from "../data/customerCommentsStorage";

export default function CustomerCommentsPreview() {
  const [comments, setComments] = useState(() => loadComments().slice(0, 3));

  useEffect(() => {
    const refresh = () => setComments(loadComments().slice(0, 3));
    refresh();
    window.addEventListener(CUSTOMER_COMMENTS_EVENT, refresh);
    return () => window.removeEventListener(CUSTOMER_COMMENTS_EVENT, refresh);
  }, []);

  if (!comments.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/40">
      <p className="mb-3 text-xs font-extrabold text-gray-800 dark:text-gray-100">آخر التعليقات</p>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100">
                {comment.customerName}
              </p>
              <span className="text-[10px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
              {comment.text}
            </p>
            {comment.managerReply?.text ? (
              <div className="mt-2 rounded-lg bg-[#6B5478]/8 px-2.5 py-2 dark:bg-[#6B5478]/15">
                <p className="flex items-center gap-1 text-[10px] font-bold text-[#6B5478]">
                  <MessageSquare size={11} />
                  رد الصالة
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-700 dark:text-gray-200">
                  {comment.managerReply.text}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                بانتظار رد الصالة
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
