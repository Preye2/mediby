// src/app/api/hms/patient/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/config/database';
import { users, doctors, hospitals, appointments } from '@/config/userSchema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, userId),
    columns: { email: true },
  });
  if (!user?.email) return NextResponse.json([], { status: 200 });

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
    .where(eq(appointments.patientEmail, user.email));

  return NextResponse.json(rows);
}