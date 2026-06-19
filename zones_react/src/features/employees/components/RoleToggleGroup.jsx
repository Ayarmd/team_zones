import { ROLES } from "../data/employeeMeta";
import { SegmentedControl } from "./employeeFormUi";

const OPTIONS = [
  { value: "reception", label: "استقبال" },
  { value: "maintenance", label: "صيانة" },
];

export default function RoleToggleGroup({ value, onChange, disabled }) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      ariaLabel="نوع الوظيفة"
    />
  );
}
