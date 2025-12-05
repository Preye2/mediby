import { sendNotification } from "@/lib/hms/notify";

export async function alertSubAdminAfterPayment(
  toEmail: string,
  patientEmail: string,
  doctorName: string,
  date: string,
  timeSlot: string,
  hospitalName: string
) {
  await sendNotification({
    toEmail,
    patientName: "Sub-Admin", // cosmetic
    doctorName,
    date,
    timeSlot,
    hospitalName,
    action: "approved", // we reuse the pretty template
  });
}

// re-export so callers import from ONE place
export { sendNotification } from "@/lib/hms/notify";