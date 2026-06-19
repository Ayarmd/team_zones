import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClassName = cn(
  "flex w-full rounded-xl border py-2.5 ps-3 pe-3 text-xs outline-none transition",
  "border-gray-300 bg-white text-gray-800",
  "focus:border-[#6B5478] focus:ring-2 focus:ring-[#6B5478]/20",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
  "placeholder:text-gray-400/75 dark:placeholder:text-gray-500/65",
);

export const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return <input type={type} className={cn(inputClassName, className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

export function PasswordInput({ value, onChange, inputClassName, placeholder = "••••••••", ...props }) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn("pe-11", inputClassName)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="إظهار/إخفاء كلمة المرور"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
