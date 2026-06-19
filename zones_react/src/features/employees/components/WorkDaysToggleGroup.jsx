import { WEEK_DAYS, parseWorkDays, serializeWorkDays } from "../data/employeeMeta";
import { SegmentedControlMulti } from "./employeeFormUi";

const OPTIONS = WEEK_DAYS.map((day) => ({
  value: day.value,
  label: day.short,
}));

export default function WorkDaysToggleGroup({ value, onChange, disabled }) {
  const selected = parseWorkDays(value);

  return (
    <SegmentedControlMulti
      options={OPTIONS}
      value={selected}
      onChange={(days) => onChange(serializeWorkDays(days))}
      disabled={disabled}
      ariaLabel="أيام العمل"
    />
  );
}
