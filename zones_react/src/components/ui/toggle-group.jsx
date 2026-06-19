import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

/** كلاسات موحّدة — موف + نص أبيض عند التحديد (مع ! لتجاوز تعارض الثيم) */
export const toggleActiveClasses =
  "data-[state=on]:!bg-[#6B5478] data-[state=on]:!text-white data-[state=on]:!border-[#6B5478] dark:data-[state=on]:!bg-[#6B5478] dark:data-[state=on]:!text-white dark:data-[state=on]:!border-[#6B5478] transition-all";

const toggleItemBase =
  "zones-toggle-item inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-bold transition-all focus:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/40 disabled:pointer-events-none disabled:opacity-50";

const toggleItemVariants = {
  outline: cn(
    toggleItemBase,
    "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
    toggleActiveClasses,
  ),
  default: cn(
    toggleItemBase,
    "border-transparent bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
    toggleActiveClasses,
  ),
};

export function ToggleGroup({ className, variant = "outline", ...props }) {
  return (
    <ToggleGroupPrimitive.Root
      data-variant={variant}
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({ className, variant = "outline", ...props }) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(toggleItemVariants[variant] ?? toggleItemVariants.outline, className)}
      {...props}
    />
  );
}
