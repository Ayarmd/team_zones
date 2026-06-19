import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const triggerCls =
  "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200/70 bg-gray-50 px-3 text-xs font-semibold text-gray-800 outline-none transition focus:border-[#6B5478]/50 focus:ring-2 focus:ring-[#6B5478]/12 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-100";

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "اختر...",
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  variant = "default",
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const activeOptionCls =
    variant === "neutral"
      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
      : "bg-[#6B5478]/12 text-[#6B5478]";

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)} dir="rtl">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(triggerCls, triggerClassName)}
      >
        <span className="min-w-0 flex-1 truncate text-start">
          {selected?.label || (
            <span className="font-semibold text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-gray-400 transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200/70 bg-white py-1 shadow-lg dark:border-gray-700/70 dark:bg-gray-900",
            menuClassName,
          )}
        >
          {options.map((item) => {
            const active = item.value === value;
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-3 py-2.5 text-start text-xs font-semibold transition",
                    active
                      ? activeOptionCls
                      : "text-gray-700 hover:bg-gray-100/80 dark:text-gray-200 dark:hover:bg-gray-700/50",
                  )}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export const alertFormFieldCls =
  "h-10 w-full rounded-xl border border-gray-200/70 bg-gray-50 px-3 text-xs font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#6B5478]/50 focus:ring-2 focus:ring-[#6B5478]/12 dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500";

export const alertFormReadOnlyCls =
  "flex h-10 w-full items-center rounded-xl border border-gray-200/70 bg-gray-50 px-3 text-xs font-semibold text-gray-600 dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-300";

export const alertFormTextareaCls =
  "min-h-[96px] w-full resize-none rounded-xl border border-gray-200/70 bg-gray-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#6B5478]/50 focus:ring-2 focus:ring-[#6B5478]/12 dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500";
