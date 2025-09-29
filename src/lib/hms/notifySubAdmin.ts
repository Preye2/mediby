import { sendNotification } from "@/lib/hms/notify"; // your existing file

export async function alertSubAdminAfterPayment(
  toEmail: string,
  toPhone: string | undefined,
  patientEmail: string,
  doctorName: string,
  date: string,
  timeSlot: string,
  hospitalName: string
) {
  const subject = "🔔 New Paid Appointment – Action Required";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:40px;">
      <div style="max-width:500px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.05);">
        <div style="background:linear-gradient(90deg,#f59e0b,#ef4444);padding:20px;text-align:center;color:#fff;">
          <h2>${subject}</h2>
        </div>
        <div style="padding:30px;">
          <p>Hi Sub-Admin,</p>
          <p>A patient <strong>${patientEmail}</strong> just paid for a slot with <strong>Dr. ${doctorName}</strong>.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${timeSlot}</p>
          <p><strong>Hospital:</strong> ${hospitalName}</p>
          <p style="margin-top:20px;">Please log in to approve or reject the booking.</p>
          <p style="margin-top:30px;">Cheers,<br>🏥 AI HealthMate Team</p>
        </div>
      </div>
    </div>
  `;

  await sendNotification({
    toEmail,
    toPhone,
    patientName: "Sub-Admin", // cosmetic only
    doctorName,
    date,
    timeSlot,
    hospitalName,
    action: "approved", // we reuse the pretty template
  });
}


export { sendNotification } from "@/lib/hms/notify"; // re-export so callers can import from ONE place