import { Archive, Ban, GitMerge, Info, Users } from "lucide-react";
import IconButton from "../../../shared/components/ui/IconButton";
import TableActionsGroup from "../../../shared/components/ui/TableActionsGroup";

export default function TournamentRowActions({
  mode = "manager",
  onDetails,
  onParticipants,
  onGenerateBracket,
  onArchive,
  onCancel,
  canGenerate = false,
  canArchive = false,
  canCancel = false,
}) {
  if (mode === "details") {
    return (
      <TableActionsGroup>
        <IconButton icon={Info} label="تفاصيل البطولة" tone="brand" onClick={onDetails} />
      </TableActionsGroup>
    );
  }

  if (mode === "viewOnly") {
    return (
      <TableActionsGroup>
        <IconButton icon={Users} label="عرض المشاركين" tone="brand" onClick={onParticipants} />
      </TableActionsGroup>
    );
  }

  return (
    <TableActionsGroup>
      <IconButton icon={Users} label="عرض المشاركين" tone="brand" onClick={onParticipants} />
      <IconButton
        icon={GitMerge}
        label="توليد المواجهات"
        tone="brand"
        onClick={onGenerateBracket}
        disabled={!canGenerate}
        className={!canGenerate ? "opacity-35" : ""}
      />
      <IconButton
        icon={Archive}
        label="أرشفة البطولة"
        tone="muted"
        onClick={onArchive}
        disabled={!canArchive}
        className={!canArchive ? "opacity-35" : ""}
      />
      <IconButton
        icon={Ban}
        label="إلغاء البطولة"
        tone="warning"
        onClick={onCancel}
        disabled={!canCancel}
        className={!canCancel ? "opacity-35" : ""}
      />
    </TableActionsGroup>
  );
}
