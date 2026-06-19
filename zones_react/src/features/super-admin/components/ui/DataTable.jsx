export default function DataTable({ columns, children, minWidth = "720px", empty }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-right text-xs" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-4 py-3 font-extrabold text-gray-600 dark:text-gray-300">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                {empty || "لا توجد بيانات لعرضها."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, bold, ltr, className = "" }) {
  return (
    <td
      className={`px-4 py-3 align-middle text-gray-700 dark:text-gray-200 ${bold ? "font-bold" : ""} ${className}`}
      dir={ltr ? "ltr" : undefined}
    >
      {children}
    </td>
  );
}

export function Tr({ children }) {
  return <tr className="transition hover:bg-[#6B5478]/5 dark:hover:bg-[#6B5478]/10">{children}</tr>;
}
