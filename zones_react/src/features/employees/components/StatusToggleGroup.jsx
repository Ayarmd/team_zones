import { STATUSES } from "../data/employeeMeta";
import { SegmentedControl } from "./employeeFormUi";

const OPTIONS = STATUSES.map((status) => ({
  value: status.value,
  label: status.label,
}));

export default function StatusToggleGroup({ value, onChange, disabled }) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      ariaLabel="حالة الموظف"
    />
  );
}
