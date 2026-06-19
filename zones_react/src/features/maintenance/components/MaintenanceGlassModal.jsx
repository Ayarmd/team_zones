import { AnimatePresence, motion } from "framer-motion";

export default function MaintenanceGlassModal({
  isOpen,
  onClose,
  title,
  children,
  wide,
  noScroll,
  footer,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="modal-overlay maint-neon-scope"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className={`reply-modal neon-card maint-modal ${noScroll ? "maint-modal--no-scroll" : ""} ${wide ? "maint-modal--wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
          >
            {title ? <h2 className="maint-modal__title">{title}</h2> : null}
            {children}
            {footer ? <div className="maint-modal__footer">{footer}</div> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
