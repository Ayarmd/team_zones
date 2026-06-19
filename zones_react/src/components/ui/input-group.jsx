import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/** shadcn/ui Input Group — أيقونة/إضافة بجانب الحقل بدون تداخل مع النص */
export function InputGroup({ className, ...props }) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-[color,box-shadow]",
        "focus-within:border-[#6B5478] focus-within:ring-2 focus-within:ring-[#6B5478]/20",
        "dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({ className, align = "inline-start", ...props }) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center justify-center select-none text-gray-400/50 dark:text-gray-500/55",
        align === "inline-start" && "ps-3 pe-2",
        align === "inline-end" && "ps-2 pe-3",
        className,
      )}
      {...props}
    />
  );
}

export const InputGroupInput = React.forwardRef(function InputGroupInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 rounded-none border-0 bg-transparent py-2 shadow-none",
        "focus:border-transparent focus:ring-0",
        "ps-1 pe-3",
        className,
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";
