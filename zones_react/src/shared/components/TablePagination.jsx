import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "./ui/IconButton";

export default function TablePagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const rangeFrom = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
      <p className="text-[11px] text-gray-500">
        عرض {rangeFrom} - {rangeTo} من {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          icon={ChevronRight}
          label="الصفحة السابقة"
          size={16}
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        />
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i + 1)}
            className={`h-7 w-7 rounded-lg text-[11px] font-bold ${
              page === i + 1
                ? "bg-[#6B5478] text-white"
                : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <IconButton
          icon={ChevronLeft}
          label="الصفحة التالية"
          size={16}
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        />
      </div>
    </div>
  );
}
