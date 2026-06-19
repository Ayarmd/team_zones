import { useEffect, useId, useRef, useState } from "react";
import { Check, Save } from "lucide-react";
import {
  GAMING_ACCESSORY_OPTIONS,
  HALL_SERVICE_OPTIONS,
  countAvailableHallServices,
} from "../../super-admin/data/hallServicesData";
import { loadManagerHall, saveManagerHall } from "../data/managerHallStorage";
import { zonesToastSuccess } from "../../../shared/utils/zonesAlerts";
import { cn } from "../../../lib/utils";

function ServicePill({ label, active, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || label}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
        active
          ? "bg-[#6B5478] text-white shadow-md shadow-[#6B5478]/30 ring-2 ring-[#6B5478]/40 dark:bg-[#6B5478] dark:text-white dark:shadow-[#6B5478]/20"
          : "border border-gray-200 bg-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function GamingAccessoriesPill({ active, accessories, onActivate, onDeactivate, onToggleAccessory }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const service = HALL_SERVICE_OPTIONS.find((s) => s.key === "gaming_accessories");

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

  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  function handlePillClick() {
    if (!active) {
      onActivate();
      setOpen(true);
      return;
    }
    setOpen((v) => !v);
  }

  function handleDeactivate() {
    onDeactivate();
    setOpen(false);
  }

  const selectedCount = GAMING_ACCESSORY_OPTIONS.filter(({ key }) => accessories[key]).length;

  return (
    <div ref={rootRef} className="relative inline-flex">
      {active && open ? (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute bottom-full right-0 z-40 mb-1.5 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {GAMING_ACCESSORY_OPTIONS.map((item) => {
            const checked = Boolean(accessories[item.key]);
            return (
              <li key={item.key} role="option" aria-selected={checked}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onToggleAccessory(item.key)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-start text-[10px] font-semibold transition",
                    checked
                      ? "bg-[#6B5478]/12 text-[#6B5478] dark:text-[#e8dff0]"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-[#6B5478] bg-[#6B5478] text-white"
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800",
                    )}
                  >
                    {checked ? <Check size={8} strokeWidth={3} /> : null}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
          <li className="border-t border-gray-100 px-2 py-1 dark:border-gray-800">
            <button
              type="button"
              onClick={handleDeactivate}
              className="w-full rounded px-1 py-1 text-[9px] font-bold text-gray-400 transition hover:text-red-500"
            >
              إلغاء الخدمة
            </button>
          </li>
        </ul>
      ) : null}

      <button
        type="button"
        onClick={handlePillClick}
        title={service?.label}
        aria-pressed={active}
        aria-expanded={open}
        aria-controls={listId}
        className={`rounded-full px-4 py-2 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/50 ${
          active
            ? "bg-[#6B5478] text-white shadow-md shadow-[#6B5478]/30 ring-2 ring-[#6B5478]/40"
            : "border border-gray-200 bg-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        {service?.shortLabel}
        {active && selectedCount > 0 ? (
          <span className="me-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[9px]">
            {selectedCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function keysToAccessories(keys) {
  const set = new Set(keys);
  return Object.fromEntries(GAMING_ACCESSORY_OPTIONS.map(({ key }) => [key, set.has(key)]));
}

function loadDraftFromHall() {
  const hall = loadManagerHall();
  return {
    services: hall.servicesAvailability,
    accessories: hall.accessoriesAvailability,
  };
}

export default function HallServicesManagerPicker({ compact = false }) {
  const [draft, setDraft] = useState(loadDraftFromHall);
  const [savedSnapshot, setSavedSnapshot] = useState(loadDraftFromHall);

  useEffect(() => {
    const refresh = () => {
      const next = loadDraftFromHall();
      setDraft(next);
      setSavedSnapshot(next);
    };
    window.addEventListener("manager-hall-updated", refresh);
    return () => window.removeEventListener("manager-hall-updated", refresh);
  }, []);

  const activeCount = countAvailableHallServices(draft.services, draft.accessories);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedSnapshot);

  function toggleService(key) {
    if (key === "gaming_accessories") return;
    setDraft((prev) => ({
      ...prev,
      services: { ...prev.services, [key]: !prev.services[key] },
    }));
  }

  function activateGamingAccessories() {
    setDraft((prev) => ({
      ...prev,
      services: { ...prev.services, gaming_accessories: true },
    }));
  }

  function deactivateGamingAccessories() {
    setDraft((prev) => ({
      ...prev,
      services: { ...prev.services, gaming_accessories: false },
      accessories: keysToAccessories([]),
    }));
  }

  function toggleAccessory(key) {
    setDraft((prev) => ({
      ...prev,
      accessories: { ...prev.accessories, [key]: !prev.accessories[key] },
    }));
  }

  function handleSave() {
    saveManagerHall({
      servicesAvailability: draft.services,
      accessoriesAvailability: draft.accessories,
    });
    setSavedSnapshot({
      services: { ...draft.services },
      accessories: { ...draft.accessories },
    });
    zonesToastSuccess("تم حفظ خدمات الصالة — ستظهر للزبائن في التطبيق");
  }

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className={`flex flex-wrap items-start justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">الخدمات المتوفرة</h2>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            اضغط على الخدمة لتفعيلها — الرمادية غير متوفرة، الموّفة تظهر للزبون.
          </p>
        </div>
        <span className="rounded-full bg-[#6B5478] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-[#6B5478]/20">
          {activeCount} نشطة
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {HALL_SERVICE_OPTIONS.map((service) =>
          service.key === "gaming_accessories" ? (
            <GamingAccessoriesPill
              key={service.key}
              active={Boolean(draft.services.gaming_accessories)}
              accessories={draft.accessories}
              onActivate={activateGamingAccessories}
              onDeactivate={deactivateGamingAccessories}
              onToggleAccessory={toggleAccessory}
            />
          ) : (
            <ServicePill
              key={service.key}
              label={service.shortLabel}
              title={service.label}
              active={Boolean(draft.services[service.key])}
              onClick={() => toggleService(service.key)}
            />
          ),
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="text-[10px] text-gray-400">الخدمات والملحقات المفعّلة فقط تظهر للزبون في التطبيق.</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6B5478] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#5a4665] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Save size={14} />
          حفظ التعديلات
        </button>
      </div>
    </section>
  );
}
