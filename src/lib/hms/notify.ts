import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type NotifyProps = {
  toEmail: string;
  patientName?: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  hospitalName: string;
  action: "approved" | "rejected";
};

export async function sendNotification({
  toEmail,
  patientName = "Patient",
  doctorName,
  date,
  timeSlot,
  hospitalName,
  action,
}: NotifyProps) {
  const subject = action === "approved" ? "✅ Appointment Approved!" : "❌ Appointment Update";

  await resend.emails.send({
    from: "MediBY <notifications@yourdomain.com>",
    to: toEmail,
    subject,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:40px;">
        <div style="max-width:500px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.05);">
          <div style="background:linear-gradient(90deg,#7c3aed,#ec4899);padding:20px;text-align:center;color:#fff;">
            <h2>${subject}</h2>
          </div>
          <div style="padding:30px;">
            <p>Hi ${patientName},</p>
            <p>Your appointment with <strong>Dr. ${doctorName}</strong> at <strong>${hospitalName}</strong> has been <strong>${action}</strong>.</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p style="margin-top:20px;">If you have questions, reply to this email or call the hospital.</p>
            <p style="margin-top:30px;">Cheers,<br>🏥 MediBY Team</p>
          </div>
        </div>
      </div>
    `,
  });
}