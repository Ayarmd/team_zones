/** مجموعة أيقونات إجراءات الجدول — محاذاة صحيحة مع RTL */
export default function TableActionsGroup({ children, className = "" }) {
  return (
    <div
      className={`inline-flex flex-nowrap items-center gap-0.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
