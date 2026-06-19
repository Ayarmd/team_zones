import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";
import DeviceStatusToggle from "../../devices-packages/components/DeviceStatusToggle";

export default function OfferRowActions({ isActive, onEdit, onToggle, onDelete }) {
  const active = isActive !== false;

  return (
    <TableActionsGroup>
      <DeviceStatusToggle
        checked={active}
        onChange={onToggle}
        showLabel={false}
        onClick={(e) => e.stopPropagation()}
      />
      <IconButton icon={Pencil} label="تعديل" tone="brand" onClick={onEdit} />
      <IconButton icon={Trash2} label="حذف" tone="danger" onClick={onDelete} />
    </TableActionsGroup>
  );
}
