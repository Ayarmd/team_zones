export default function SectionCard({ title, description, actions, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            {title ? <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[11px] text-gray-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
