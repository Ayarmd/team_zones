import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-[#6B5478] text-white shadow-sm hover:bg-[#5a4668] dark:bg-[#6B5478] dark:hover:bg-[#5a4668]",
  outline:
    "border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800",
  ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-lg px-3 text-xs",
  lg: "h-11 rounded-xl px-6",
  icon: "h-10 w-10",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/40 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.default,
        className,
      )}
      {...props}
    />
  );
}
