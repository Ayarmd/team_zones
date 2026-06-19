import { ArrowRight } from "lucide-react";

export default function PageHeader({ title, description, actions, onBack, backLabel = "رجوع" }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-4 dark:border-gray-800">
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-extrabold text-gray-900 dark:text-white">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            title={backLabel}
            className="flex items-center p-0 text-[#6B5478] transition hover:text-[#5a4668] dark:hover:text-[#c4b5d0]"
          >
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
}