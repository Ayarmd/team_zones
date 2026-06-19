import { MoreVertical } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import IconButton from "../../../shared/components/ui/IconButton";

const items = [
  { key: "start", label: "بدء البطولة" },
  { key: "finish", label: "إنهاء البطولة" },
  { key: "cancel", label: "إلغاء البطولة", warn: true },
];

export default function ActionMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
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
    <div className="relative inline-flex" ref={rootRef}>
      <IconButton
        icon={MoreVertical}
        label="إجراءات البطولة"
        size={16}
        className="text-violet-200 hover:text-violet-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      />

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute end-0 top-full z-40 mt-1 min-w-[11.5rem] overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b0e14]/98 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-violet-500/15 backdrop-blur-md"
        >
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              className={
                it.warn
                  ? "flex w-full items-center justify-end px-3 py-2 text-end text-sm font-medium text-rose-300/95 transition hover:bg-rose-950/40"
                  : "flex w-full items-center justify-end px-3 py-2 text-end text-sm font-medium text-slate-200 transition hover:bg-[#151a24]"
              }
              onClick={() => {
                setOpen(false);
                onAction(it.key, row);
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
