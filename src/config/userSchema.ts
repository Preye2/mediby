// src/config/userSchema.ts
import { sql } from "drizzle-orm";
import {
  integer,
  varchar,
  text,
  timestamp,
  date,
  json,
  pgTable,
  pgEnum,
  index,
  real,
 
} from "drizzle-orm/pg-core";

/* ----------  1.  USERS (Clerk)  ---------- */
export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_users_clerk_id").on(table.clerkId)]
);

/* ----------  2.  AI-CHAT SESSIONS  ---------- */
export const SessionChatTable = pgTable(
  "sessionChatTable",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    sessionId: varchar("sessionId").notNull().unique(),

    note: varchar("note").notNull(),

    /* ---- JSON with proper SQL defaults (Neon-safe) ---- */
    conversation: json("conversation")
      .$type<{ role: string; text: string; ts?: string }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`), // cast empty array once

    selectedDoctor: json("selectedDoctor")
      .$type<{
        id?: number | string;
        name?: string;
        specialty?: string;
        description?: string;
        image?: string;
        agentPrompt?: string;
        doctorVoiceId?: string;
      }>()
      .notNull()
      .default(sql`'{}'::jsonb`), // cast empty object once

    /* ---- nullable report ---- */
    report: json("report")
      .$type<{
        mainComplaint?: string;
        symptoms?: string[];
        duration?: string;
        severity?: "mild" | "moderate" | "severe";
        medicationsMentioned?: string[];
        recommendations?: string[];
        summary?: string;
      }>()
      .default(sql`null`), // null instead of {}

    status: varchar("status", { enum: ["active", "completed"] }).default("active"),

    needsSummary: integer("needs_summary").default(1),

    language: varchar("language", { length: 10 }).default("english"),

    confidence: real("confidence").default(0.85),

    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.clerkId, { onDelete: "cascade" }),

    createdBy: varchar("createdBy", { length: 255 }),

    createdOn: timestamp("createdOn").defaultNow(),

    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => [
    index("idx_session_user_created").on(table.userId, table.createdOn),
    index("idx_session_status").on(table.status),
    index("idx_session_id").on(table.sessionId),
    index("idx_needs_summary").on(table.needsSummary),
  ]
);

/* ----------  3.  HOSPITAL MODULE  ---------- */
export const hospitals = pgTable("hospitals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: varchar("logo"),
  contactPhone: varchar("contact_phone"),
  contactEmail: varchar("contact_email"),
  address: text("address"),
  clerkOrgId: varchar("clerk_org_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ----------  4.  DOCTORS  (human only)  ---------- */
export const doctors = pgTable(
  "doctors",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),
    hospitalId: integer("hospital_id")
      .references(() => hospitals.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    specialization: varchar("specialization", { length: 255 }).notNull(),
    fee: integer("fee").notNull(),
    bio: text("bio"),
    available: integer("available").default(1),
    avatar: varchar("avatar"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_doctors_hospital").on(table.hospitalId)]
);

/* ----------  5.  AI DOCTORS  ---------- */
export const aiDoctors = pgTable("ai_doctors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }).notNull(),
  voiceId: varchar("voice_id", { length: 255 }).notNull(),
  language: varchar("language", { length: 10 }).default("english"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ----------  6.  APPOINTMENTS  ---------- */
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "paid",
  "approved",
  "completed",
  "cancelled",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    patientEmail: varchar("patient_email").notNull(),
    hospitalId: integer("hospital_id")
      .notNull()
      .references(() => hospitals.id, { onDelete: "cascade" }),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    timeSlot: varchar("time_slot").notNull(),
    status: appointmentStatusEnum("status").default("pending"),
    paystackRef: varchar("paystack_ref"),
    twilioRoomSid: varchar("twilio_room_sid").unique(),
    note: text("note"),
    approvedAt: timestamp("approved_at"),
    approvedBy: varchar("approved_by"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_appointments_hospital_status").on(table.hospitalId, table.status),
    index("idx_appointments_doctor_date").on(table.doctorId, table.date),
  ]
);

/* ----------  7.  EXPORT  ---------- */
export const schema = {
  users,
  SessionChatTable,
  hospitals,
  doctors,
  aiDoctors,
  appointments,
};
