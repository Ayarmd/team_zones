import { cn } from "@/lib/utils";
import { Input, PasswordInput } from "./input";

export const fieldLabelClass = "mb-1.5 block text-[11px] font-bold text-gray-500 dark:text-gray-400";

const disabledInputClass =
  "cursor-default border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";

/** حقل نموذج بدون أيقونة داخلية — الأيقونات محصورة بحقول البحث فقط */
export function IconField({
  label,
  icon: _icon,
  value,
  onChange,
  disabled,
  type = "text",
  ltr,
  hint,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={className}>
      <label className={fieldLabelClass}>{label}</label>
      <Input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        dir={ltr ? "ltr" : undefined}
        className={cn(disabled && disabledInputClass, inputClassName)}
        {...props}
      />
      {hint ? <p className="mt-1 text-[10px] text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function PasswordField({ label, value, onChange, className, ...props }) {
  return (
    <div className={className}>
      <label className={fieldLabelClass}>{label}</label>
      <PasswordInput value={value} onChange={onChange} {...props} />
    </div>
  );
}
