import { ToggleLeft, ToggleRight } from "lucide-react";
import { useId } from "react";

export default function DeviceStatusToggle({
  checked,
  onChange,
  disabled,
  activeLabel = "مفعّل",
  inactiveLabel = "معطّل",
  showLabel = true,
  onClick,
}) {
  const id = useId();
  const statusText = checked ? activeLabel : inactiveLabel;
  const Icon = checked ? ToggleRight : ToggleLeft;

  const handleClick = (e) => {
    onClick?.(e);
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={statusText}
      title={statusText}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex shrink-0 items-center rounded-md p-1.5 transition ${
        showLabel ? "gap-2" : "gap-0"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:opacity-80"
      } ${
        checked
          ? "text-[#6B5478] dark:text-[#c4b5d0]"
          : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      }`}
    >
      <Icon size={22} strokeWidth={2.25} aria-hidden className="shrink-0" />
      {showLabel ? (
        <span
          className={`min-w-[3rem] text-xs font-bold ${
            checked
              ? "text-[#6B5478] dark:text-[#c4b5d0]"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {statusText}
        </span>
      ) : null}
    </button>
  );
}
