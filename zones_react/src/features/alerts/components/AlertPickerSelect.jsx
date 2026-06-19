import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { alertTargetLabel, toggleTargetCategorySelection } from "../data/alertsMeta";

const triggerCls =
  "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#6B5478]/40 focus:border-[#6B5478] focus:outline-none focus:ring-2 focus:ring-[#6B5478]/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

export default function AlertPickerSelect({
  label,
  value,
  onChange,
  options,
  multiple = false,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (multiple) return alertTargetLabel(value);
    const item = options.find((opt) => opt.value === value);
    return item?.label || "—";
  }, [multiple, options, value]);

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

  const isSelected = (optionValue) => {
    if (multiple) {
      const list = Array.isArray(value) ? value : [];
      if (optionValue === "all") return list.includes("all");
      return list.includes(optionValue);
    }
    return value === optionValue;
  };

  const handlePick = (optionValue) => {
    if (multiple) {
      onChange(toggleTargetCategorySelection(value, optionValue));
      return;
    }
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      {label ? (
        <p className="mb-1.5 text-[10px] font-bold text-gray-400">{label}</p>
      ) : null}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className="absolute z-20 mt-1 w-full min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {options.map((item) => {
            const active = isSelected(item.value);
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => handlePick(item.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-start text-xs font-semibold transition ${
                    active
                      ? "bg-[#6B5478]/12 text-[#6B5478]"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {active ? <Check size={14} strokeWidth={2.5} /> : null}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
