import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold transition",
        variant === "default" && "bg-[#6B5478]/12 text-[#6B5478] dark:text-[#c4b5d0]",
        variant === "secondary" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
        variant === "outline" && "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300",
        className,
      )}
      {...props}
    />
  );
}
