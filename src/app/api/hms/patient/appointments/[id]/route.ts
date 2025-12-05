// src/app/api/hms/patient/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/config/database';
import { users, appointments, doctors, hospitals } from '@/config/userSchema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    /* ---------- 1. Auth ---------- */
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId),
      columns: { email: true },
    });
    if (!user?.email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    /* ---------- 2. Await params ---------- */
    const { id } = await params;

    /* ---------- 3. Fetch single approved appointment ---------- */
    const appointment = await db
            .select({
        id: appointments.id,
        date: appointments.date,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        doctorName: doctors.fullName,
        specialization: doctors.specialization,
        hospitalName: hospitals.name,
        fee: doctors.fee,
        twilioRoomSid: appointments.twilioRoomSid,
      })
      .from(appointments)
      .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
      .innerJoin(hospitals, eq(hospitals.id, appointments.hospitalId))
      .where(
        and(
          eq(appointments.id, Number(id)),
          eq(appointments.patientEmail, user.email),
          eq(appointments.status, 'approved')
        )
      )
      .limit(1);

    if (!appointment.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(appointment[0]);
  } catch (err) {
    console.error('[Single apt] 🔥', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}