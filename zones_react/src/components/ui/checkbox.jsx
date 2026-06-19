import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B5478]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-[#6B5478] data-[state=checked]:bg-[#6B5478] data-[state=checked]:text-white",
        "dark:border-gray-600 dark:bg-gray-950",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check size={12} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
