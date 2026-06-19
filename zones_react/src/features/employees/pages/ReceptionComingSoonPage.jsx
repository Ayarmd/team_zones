import { Construction } from "lucide-react";
import PageHeader from "../../super-admin/components/ui/PageHeader";
import IconGlyph from "../../../shared/components/ui/IconGlyph";

export default function ReceptionComingSoonPage({ title, description }) {
  return (
    <div>
      <PageHeader title={title} description={description || "هذه الواجهة قيد التطوير ضمن لوحة موظف الاستقبال."} />
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
        <IconGlyph icon={Construction} tone="primary" size={28} className="mb-4" />
        <p className="text-sm font-extrabold text-gray-800 dark:text-gray-100">قريباً</p>
        <p className="mt-2 max-w-md text-xs text-gray-500 dark:text-gray-400">
          سيتم إضافة هذه الواجهة بنفس نمط وتصميم لوحة تحكم الأدمن.
        </p>
      </div>
    </div>
  );
}

