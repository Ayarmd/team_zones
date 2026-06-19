import { useRef } from "react";
import { Download } from "lucide-react";
import AdminModal from "../../devices-packages/components/AdminModal";
import Button from "../../super-admin/components/ui/Button";
import ReceptionBookingVoucher from "./ReceptionBookingVoucher";
import { generateBookingVoucherPdf } from "../utils/generateBookingVoucherPdf";

export default function ReceptionBookingVoucherModal({ open, voucher, hallName, onClose }) {
  const voucherRef = useRef(null);

  if (!voucher) return null;

  const downloadPdf = async () => {
    if (!voucherRef.current) return;
    await generateBookingVoucherPdf(
      voucherRef.current,
      `${voucher.bookingCode}-voucher.pdf`,
    );
  };

  return (
    <AdminModal open={open} onClose={onClose} title="وصل الحجز" wide>
      <div ref={voucherRef} className="mt-4">
        <ReceptionBookingVoucher voucher={voucher} hallName={hallName} />
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          إغلاق
        </Button>
        <Button type="button" size="sm" icon={Download} onClick={downloadPdf}>
          تحميل PDF
        </Button>
      </div>
    </AdminModal>
  );
}
