/** اختصار يوم إنجليزي لمحور الشارت — بدون أرقام (Sun, Mon, Tue, …) */
export function formatChartWeekdayLabel(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
