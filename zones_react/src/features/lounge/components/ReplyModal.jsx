import { AnimatePresence, motion } from "framer-motion";

export default function ReplyModal({ isOpen, onClose, onSubmit, value, onChange, commentAuthor }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="reply-modal neon-card"
            role="dialog"
            aria-modal="true"
            aria-label="رد على التعليق"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h3>الرد على {commentAuthor}</h3>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="اكتب ردك على التعليق..."
              rows={5}
            />
            <div className="reply-modal-actions">
              <button className="ghost-link" onClick={onClose} type="button">
                إلغاء
              </button>
              <button className="primary-btn" onClick={onSubmit} type="button">
                إرسال
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
