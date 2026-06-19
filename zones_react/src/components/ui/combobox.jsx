import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { resolveDeviceTypeInput } from "../../features/devices-packages/data/deviceNaming";

const triggerCls =
  "flex h-10 w-full items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 outline-none transition focus-within:border-[#6B5478] focus-within:ring-2 focus-within:ring-[#6B5478]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

/** قائمة منسدلة + كتابة — اختيار من القائمة أو إدخال نوع مخصّص */
export function Combobox({
  value,
  displayValue,
  onValueChange,
  options,
  placeholder = "اختر أو اكتب...",
  disabled = false,
  className,
  resolveInput,
  onCommit,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(displayValue || "");

  useEffect(() => {
    setQuery(displayValue || "");
  }, [displayValue]);

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

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((o) => o.label.toLowerCase().includes(normalizedQuery))
    : options;

  const selected = options.find((o) => o.value === value || o.label === displayValue);
  const showAddOption =
    query.trim() &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  const applyQuery = (text) => {
    setQuery(text);
    if (resolveInput) {
      resolveInput(text);
      return;
    }
    const match = options.find((o) => o.label.toLowerCase() === text.trim().toLowerCase());
    if (match) {
      onValueChange(match.value);
      return;
    }
    onValueChange(text.trim());
  };

  const commitCustom = () => {
    const text = query.trim();
    if (!text || !onCommit) return;
    onCommit(text);
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className={triggerCls}>
        {selected?.icon ? (
          <span className="flex shrink-0 text-[#6B5478]">{selected.icon}</span>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onFocus={() => setOpen(true)}
          onBlur={commitCustom}
          onChange={(e) => applyQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="flex shrink-0 items-center justify-center text-gray-400"
          aria-label="فتح القائمة"
        >
          <ChevronDown size={14} className={cn("transition", open && "rotate-180")} />
        </button>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {showAddOption ? (
            <li role="option">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  commitCustom();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 text-start text-xs font-bold text-[#6B5478] transition hover:bg-[#6B5478]/8 dark:border-gray-800"
              >
                <span>+ إضافة «{query.trim()}» للقائمة</span>
              </button>
            </li>
          ) : null}
          {filtered.map((item) => {
            const active = item.value === value;
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(item.label);
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-xs font-semibold transition",
                    active
                      ? "bg-[#6B5478]/12 text-[#6B5478]"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800",
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {active ? <Check size={14} strokeWidth={2.5} /> : null}
                  </span>
                  {item.icon ? (
                    <span className="flex shrink-0 text-[#6B5478]">{item.icon}</span>
                  ) : null}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && !showAddOption ? (
            <li className="px-3 py-2.5 text-center text-[11px] text-gray-400">لا توجد نتائج</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function DeviceTypeCombobox({ type, typeLabel, onTypeResolved, options, disabled, onPersistType }) {
  const groups = [{ options: options.map((o) => ({ value: o.value, label: o.label })) }];

  const persist = (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;
    const resolved = resolveDeviceTypeInput(trimmed, groups);
    onTypeResolved(resolved);
    onPersistType?.(resolved);
  };

  return (
    <Combobox
      value={type}
      displayValue={typeLabel}
      options={options}
      placeholder="اختر من القائمة أو اكتب نوعاً..."
      disabled={disabled}
      resolveInput={(text) => {
        const resolved = resolveDeviceTypeInput(text, groups);
        onTypeResolved(resolved);
      }}
      onCommit={persist}
      onValueChange={(picked) => {
        const option = options.find((o) => o.value === picked);
        if (option) {
          onTypeResolved({ type: option.value, typeLabel: option.label });
          return;
        }
        persist(picked);
      }}
    />
  );
}
