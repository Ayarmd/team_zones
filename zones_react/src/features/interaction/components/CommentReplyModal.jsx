import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import { customerInitials, formatRelativeTime } from "../data/customerCommentsStorage";

const textareaCls =
  "w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-xs leading-relaxed text-gray-800 outline-none focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

export default function CommentReplyModal({ open, comment, replyText, onChange, onClose, onSave }) {
  const isEdit = Boolean(comment?.managerReply?.text);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل الرد" : "الرد على التعليق"}
      wide
    >
      {comment ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6B5478]/15 text-sm font-extrabold text-[#6B5478]">
                {customerInitials(comment.customerName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                    {comment.customerName}
                  </p>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  {comment.text}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400">
              رد الصالة
            </label>
            <textarea
              rows={4}
              className={textareaCls}
              value={replyText}
              onChange={(e) => onChange(e.target.value)}
              placeholder="اكتب ردك باحتراف — يظهر للزبائن في التطبيق..."
              autoFocus
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button size="sm" onClick={onSave} disabled={!replyText.trim()}>
              {isEdit ? "حفظ" : "إرسال الرد"}
            </Button>
          </div>
        </div>
      ) : null}
    </AdminModal>
  );
}
