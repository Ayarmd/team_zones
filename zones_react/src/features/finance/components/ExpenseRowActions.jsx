import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";

export default function ExpenseRowActions({ onEdit, onDelete }) {
  return (
    <TableActionsGroup>
      <IconButton icon={Pencil} label="تعديل" tone="brand" onClick={onEdit} />
      <IconButton icon={Trash2} label="حذف" tone="danger" onClick={onDelete} />
    </TableActionsGroup>
  );
}
