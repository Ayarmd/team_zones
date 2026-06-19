import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOOKING_SOURCE_FILTERS } from "../utils/receptionBookingsFilters";
import "./ReceptionBookingsDateNav.css";

export default function ReceptionBookingsSourceFilter({ value, onChange, className }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const options = BOOKING_SOURCE_FILTERS;
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex] || options[0];

  const shift = (delta) => {
    const next = (selectedIndex + delta + options.length) % options.length;
    onChange(options[next].value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className={cn("rb-date-nav rb-date-nav--inline", className)} ref={rootRef}>
      <div className="rb-date-nav-bar rb-source-filter-bar">
        <button
          type="button"
          className="rb-date-nav-arrow"
          onClick={() => shift(-1)}
          aria-label="الخيار السابق"
        >
          <ChevronRight size={15} strokeWidth={2.25} />
        </button>

        <button
          type="button"
          className="rb-date-nav-trigger rb-source-filter-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
        >
          <span className="rb-date-nav-label">{selected.label}</span>
        </button>

        <button
          type="button"
          className="rb-date-nav-arrow"
          onClick={() => shift(1)}
          aria-label="الخيار التالي"
        >
          <ChevronLeft size={15} strokeWidth={2.25} />
        </button>
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="rb-source-filter-menu"
          aria-label="تصفية مصدر الحجز"
        >
          {options.map((item) => {
            const active = item.value === value;
            return (
              <li key={item.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={cn("rb-source-filter-option", active && "rb-source-filter-option--active")}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
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
