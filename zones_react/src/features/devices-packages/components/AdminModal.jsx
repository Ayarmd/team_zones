const WIDTH = {
  default: "max-w-lg",
  wide: "max-w-2xl",
  xl: "max-w-5xl",
};

export default function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  xl,
  stickyLayout = false,
}) {
  if (!open) return null;

  const widthClass = xl ? WIDTH.xl : wide ? WIDTH.wide : WIDTH.default;

  if (stickyLayout) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      >
        <div
          className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 ${widthClass}`}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</h3>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:border-gray-800 dark:bg-gray-900 ${widthClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}
