import { SHIFTS } from "../data/employeeMeta";
import { SegmentedControl } from "./employeeFormUi";

const OPTIONS = SHIFTS.map((shift) => ({
  value: shift.value,
  label:
    shift.value === "morning"
      ? "صباحي"
      : shift.value === "evening"
        ? "مسائي"
        : "كامل",
}));

export default function ShiftToggleGroup({ value, onChange, disabled }) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      disabled={disabled}
      ariaLabel="نوع الدوام"
    />
  );
}
