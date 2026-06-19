import { Plus, Archive, Eye, Pencil } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import SearchBar from "../../super-admin/components/ui/SearchBar";
import { normalizeStatus, statusLabel } from "../data/employeeMeta";

export function StaffStatusBadge({ status }) {
  const key = normalizeStatus(status);
  const styles = {
    working: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    leave: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${styles[key] || "bg-gray-200 text-gray-500"}`}>
      {statusLabel(status)}
    </span>
  );
}

export function StaffRowActions({ onDetails, onEdit, onArchive }) {
  return (
    <TableActionsGroup>
      <IconButton icon={Eye} label="عرض التفاصيل" tone="brand" onClick={onDetails} />
      <IconButton icon={Pencil} label="تعديل" tone="brand" onClick={onEdit} />
      <IconButton icon={Archive} label="أرشفة" tone="warning" onClick={onArchive} />
    </TableActionsGroup>
  );
}

export function StaffAddButton({ onClick, label = "إضافة موظف" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#6B5478] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#6B5478]/30 transition hover:bg-[#5a4668]"
    >
      <Plus size={16} strokeWidth={2.5} />
      {label}
    </button>
  );
}

export function StaffSearchToolbar({ search, onSearchChange, onAddClick }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SearchBar value={search} onChange={onSearchChange} placeholder="بحث بالاسم أو البريد أو الهاتف..." />
      <StaffAddButton onClick={onAddClick} />
    </div>
  );
}
