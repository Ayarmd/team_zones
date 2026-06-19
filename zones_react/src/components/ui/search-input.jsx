import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";

/** shadcn/ui search field — InputGroup + أيقونة بحث */
export default function SearchInput({
  value,
  onChange,
  placeholder = "بحث...",
  className,
  containerClassName,
  id,
  ...props
}) {
  return (
    <InputGroup className={cn("h-10 max-w-sm", containerClassName)} dir="rtl">
      <InputGroupAddon align="inline-start">
        <Search className="size-4 shrink-0" strokeWidth={2} aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn("font-medium", className)}
        {...props}
      />
    </InputGroup>
  );
}
