import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS_AR = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(iso) {
  const d = parseIso(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMonthTitle(year, month) {
  return new Date(year, month, 1).toLocaleDateString("ar-LY", { month: "long", year: "numeric" });
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = first.getDay();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  return cells;
}

export default function ReceptionDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = parseIso(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    const d = parseIso(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pickDay = (day) => {
    onChange(toIso(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  };

  const isSelected = (day) =>
    day &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;

  const isToday = (day) => {
    if (!day) return false;
    const now = new Date();
    return (
      now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day
    );
  };

  return (
    <div className="rcal-picker" ref={rootRef}>
      <button
        type="button"
        className="rcal-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays size={16} className="shrink-0" />
        <span dir="ltr">{formatDisplay(value)}</span>
      </button>

      {open ? (
        <div className="rcal-picker-popover" role="dialog" aria-label="اختيار التاريخ">
          <div className="rcal-picker-popover-head">
            <button type="button" className="rcal-picker-nav" onClick={() => shiftMonth(-1)} aria-label="الشهر السابق">
              <ChevronRight size={16} />
            </button>
            <span className="rcal-picker-month">{formatMonthTitle(viewYear, viewMonth)}</span>
            <button type="button" className="rcal-picker-nav" onClick={() => shiftMonth(1)} aria-label="الشهر التالي">
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="rcal-picker-weekdays">
            {WEEKDAYS_AR.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="rcal-picker-grid">
            {grid.map((day, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!day}
                className={`rcal-picker-day ${isSelected(day) ? "is-selected" : ""} ${isToday(day) ? "is-today" : ""}`}
                onClick={() => day && pickDay(day)}
              >
                {day || ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
