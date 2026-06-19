import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayIso } from "../data/receptionCalendarStorage";
import "./ReceptionBookingsDateNav.css";

const WEEKDAYS_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

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

function shiftIsoDate(iso, deltaDays) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + deltaDays);
  return toIso(d);
}

function formatCompactLabel(iso) {
  const d = parseIso(iso);
  const weekday = d.toLocaleDateString("ar-LY", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("ar-LY", { month: "short" });
  return `${weekday} ${day} ${month}`;
}

function formatMonthTitle(year, month) {
  return new Date(year, month, 1).toLocaleDateString("ar-LY", { month: "long", year: "numeric" });
}

function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = first.getDay();
  const cells = [];

  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i -= 1) {
    cells.push({ day: prevMonthLast - i, outside: true, monthDelta: -1 });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, outside: false, monthDelta: 0 });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay, outside: true, monthDelta: 1 });
    nextDay += 1;
  }
  return cells;
}

export default function ReceptionBookingsDateNav({ value, onChange, className, inline = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = parseIso(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const isToday = value === todayIso();

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

  const grid = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pickCell = (cell) => {
    const d = new Date(viewYear, viewMonth + cell.monthDelta, cell.day);
    onChange(toIso(d));
    setOpen(false);
  };

  const cellIso = (cell) => toIso(new Date(viewYear, viewMonth + cell.monthDelta, cell.day));

  const isSelectedCell = (cell) => cellIso(cell) === value;

  const isTodayCell = (cell) => cellIso(cell) === todayIso();

  return (
    <div className={cn("rb-date-nav", inline && "rb-date-nav--inline", className)} ref={rootRef}>
      <div className="rb-date-nav-bar">
        <button
          type="button"
          className="rb-date-nav-arrow"
          onClick={() => onChange(shiftIsoDate(value, -1))}
          aria-label="اليوم السابق"
        >
          <ChevronRight size={15} strokeWidth={2.25} />
        </button>

        <button
          type="button"
          className="rb-date-nav-trigger"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span className="rb-date-nav-label">{formatCompactLabel(value)}</span>
          {isToday ? <span className="rb-date-nav-today">اليوم</span> : null}
        </button>

        <button
          type="button"
          className="rb-date-nav-arrow"
          onClick={() => onChange(shiftIsoDate(value, 1))}
          aria-label="اليوم التالي"
        >
          <ChevronLeft size={15} strokeWidth={2.25} />
        </button>
      </div>

      {!inline && !isToday ? (
        <button type="button" className="rb-date-nav-back-today" onClick={() => onChange(todayIso())}>
          العودة لليوم
        </button>
      ) : null}

      {open ? (
        <div className="rb-date-cal" role="dialog" aria-label="اختيار التاريخ">
          <div className="rb-date-cal-head">
            <button type="button" className="rb-date-cal-nav" onClick={() => shiftMonth(-1)} aria-label="الشهر السابق">
              <ChevronRight size={16} />
            </button>
            <span className="rb-date-cal-month">{formatMonthTitle(viewYear, viewMonth)}</span>
            <button type="button" className="rb-date-cal-nav" onClick={() => shiftMonth(1)} aria-label="الشهر التالي">
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="rb-date-cal-weekdays">
            {WEEKDAYS_AR.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="rb-date-cal-grid">
            {grid.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                className={cn(
                  "rb-date-cal-day",
                  cell.outside && "rb-date-cal-day--outside",
                  isSelectedCell(cell) && "rb-date-cal-day--selected",
                  isTodayCell(cell) && !isSelectedCell(cell) && "rb-date-cal-day--today",
                )}
                onClick={() => pickCell(cell)}
              >
                {cell.day}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
