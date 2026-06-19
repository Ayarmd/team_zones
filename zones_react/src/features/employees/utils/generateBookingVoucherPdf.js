import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function generateBookingVoucherPdf(element, fileName) {
  if (!element) throw new Error("عنصر الوصل غير موجود");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", margin, margin, contentWidth, imgHeight);
  pdf.save(fileName);
}
