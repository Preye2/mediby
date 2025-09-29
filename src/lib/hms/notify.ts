 import { Resend } from "resend";
import twilio from "twilio";

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

type NotifyProps = {
  toEmail: string;
  toPhone?: string;
  patientName?: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  hospitalName: string;
  action: "approved" | "rejected";
};

export async function sendNotification({
  toEmail,
  toPhone,
  patientName = "Patient",
  doctorName,
  date,
  timeSlot,
  hospitalName,
  action,
}: NotifyProps) {
  const subject = action === "approved" ? "✅ Appointment Approved!" : "❌ Appointment Update";
  const html = `
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
          <p style="margin-top:30px;">Cheers,<br>🏥 AI HealthMate Team</p>
        </div>
      </div>
    </div>
  `;

  // 1. Email (Resend)
  await resend.emails.send({
    from: "AI HealthMate <notifications@yourdomain.com>",
    to: toEmail,
    subject,
    html,
  });

  // 2. SMS (Twilio) – optional
  if (toPhone) {
    const smsBody = action === "approved"
      ? `✅ Your appointment with Dr. ${doctorName} on ${date} at ${timeSlot} is APPROVED. See you soon!`
      : `❌ Your appointment on ${date} at ${timeSlot} has been cancelled. Please re-book.`;
    await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: toPhone,
    });
  }
}