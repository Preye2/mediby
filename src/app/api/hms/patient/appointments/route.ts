// src/app/api/hms/patient/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/config/database';
import { users, doctors, hospitals, appointments } from '@/config/userSchema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    /* ---------- 1. Auth ---------- */
    const { userId } = await auth();
    if (!userId) {
      console.log('[Appointments] ❌ No clerk userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* ---------- 2. Resolve user email ---------- */
    /* ---------- 2. Resolve user email ---------- */
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.clerkId, userId),
  columns: { email: true },
});
console.log('[Appointments] clerkId:', userId, '→ email:', user?.email); // ← add this
if (!user?.email) {
  console.log('[Appointments] ⚠️  No email for clerkId:', userId);
  return NextResponse.json([], { status: 200 });
}

    /* ---------- 3. Pull appointments ---------- */
    const rows = await db
      .select({
        id: appointments.id,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        doctorName: doctors.fullName,
        specialization: doctors.specialization,
        hospitalName: hospitals.name,
        fee: doctors.fee,
        paystackRef: appointments.paystackRef,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .innerJoin(hospitals, eq(hospitals.id, appointments.hospitalId))
      .where(eq(appointments.patientEmail, user.email))
      .orderBy(appointments.date, appointments.timeSlot); // newest first

    console.log(`[Appointments] ✅ ${rows.length} rows for ${user.email}`);
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error('[Appointments] 🔥', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}