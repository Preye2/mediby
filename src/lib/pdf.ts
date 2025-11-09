// src/lib/pdf.ts
import jsPDF from 'jspdf';
export async function generatePdf(data: any): Promise<Buffer> {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('MediBY Consultation Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Main Complaint: ${data.mainComplaint}`, 20, 35);
  doc.text(`Severity: ${data.severity}`, 20, 45);
  doc.text(`Duration: ${data.duration}`, 20, 55);
  doc.text('Symptoms:', 20, 65);
  data.symptoms.forEach((s: string, i: number) => doc.text(` • ${s}`, 25, 75 + i * 6));
  // …add meds, recommendations, summary, full transcript…
  return Buffer.from(doc.output('arraybuffer'));
}