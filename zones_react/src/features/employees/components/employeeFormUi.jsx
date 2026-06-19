export function FormSectionTag({ children, editable = false }) {
  return (
    <span
      className={`mb-3 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold ${
        editable
          ? "bg-[#6B5478]/12 text-[#6B5478] dark:bg-[#6B5478]/20 dark:text-[#c4b5d0]"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400"
      }`}
    >
      {children}
    </span>
  );
}

export function FormFieldLabel({ children, htmlFor }) {
  const Tag = htmlFor ? "label" : "p";
  return (
    <Tag
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-bold text-gray-400 dark:text-gray-500"
    >
      {children}
    </Tag>
  );
}

const trackCls =
  "flex w-full overflow-hidden rounded-xl border border-gray-200/90 bg-gray-100/90 p-0.5 dark:border-white/10 dark:bg-gray-950/70";

const segmentBase =
  "min-w-0 flex-1 px-1.5 py-2 text-[11px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:px-2 sm:text-xs";

const segmentDivider = "border-s border-gray-200/80 dark:border-white/10";

function segmentState(active) {
  return active
    ? "rounded-[10px] bg-[#6B5478] text-white shadow-sm shadow-[#6B5478]/35"
    : "text-gray-600 hover:bg-white/60 hover:text-[#6B5478] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-[#c4b5d0]";
}

/** اختيار واحد — Segmented Control */
export function SegmentedControl({ options, value, onChange, disabled, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={trackCls}>
      {options.map((opt, index) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`${segmentBase} ${index > 0 ? segmentDivider : ""} ${segmentState(active)}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** اختيار متعدد — شريط أيام العمل */
export function SegmentedControlMulti({ options, value = [], onChange, disabled, ariaLabel }) {
  const selected = new Set(value);

  const toggle = (optionValue) => {
    if (disabled) return;
    const next = selected.has(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(next);
  };

  return (
    <div role="group" aria-label={ariaLabel} className={trackCls}>
      {options.map((opt, index) => {
        const active = selected.has(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={`${segmentBase} ${index > 0 ? segmentDivider : ""} ${segmentState(active)}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
