// src/config/userSchema.ts
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
  real, // <-- for confidence
} from "drizzle-orm/pg-core";

/* ----------  1.  USERS (Clerk)  ---------- */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("idx_users_clerk_id").on(table.clerkId)]);

/* ----------  2.  AI-CHAT SESSIONS  ---------- */
export const SessionChatTable = pgTable("sessionChatTable", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("sessionId").notNull().unique(),
  note: varchar("note").notNull(),
  conversation: json("conversation")
    .$type<{ role: string; text: string; ts?: string }[]>()
    .notNull()
    .default([]),
  selectedDoctor: json("selectedDoctor")
    .$type<{ id: string; name: string; doctorVoiceId?: string }>()
    .notNull(),
  report: json("report").$type<{
    mainComplaint?: string;
    symptoms?: string[];
    duration?: string;
    severity?: "mild" | "moderate" | "severe";
    medicationsMentioned?: string[];
    recommendations?: string[];
    summary?: string;
  }>(),
  status: varchar("status", { enum: ["active", "completed"] }).default("active"),
  needsSummary: integer("needs_summary").default(1),

  // NEW: make old + new rows complete
  language: varchar("language", { length: 10 }).default("english"),
  confidence: real("confidence").default(0.85),

  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  createdBy: varchar("createdBy", { length: 255 }),
  createdOn: timestamp("createdOn").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => [
  index("idx_session_user_created").on(table.userId, table.createdOn),
  index("idx_session_status").on(table.status),
  index("idx_session_id").on(table.sessionId),
  index("idx_needs_summary").on(table.needsSummary),
]);

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

export const doctors = pgTable("doctors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }).notNull(),
  fee: integer("fee").notNull(), // kobo
  bio: text("bio"),
  avatar: varchar("avatar"),
  doctorVoiceId: varchar("doctor_voice_id"),
});

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "paid",
  "approved",
  "completed",
  "cancelled",
]);

export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientEmail: varchar("patient_email").notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  date: date("date").notNull(),
  timeSlot: varchar("time_slot").notNull(),
  status: appointmentStatusEnum("status").default("pending"),
  paystackRef: varchar("paystack_ref"),
  dailyCoRoomUrl: varchar("daily_co_room_url"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ----------  4.  EXPORT BUNDLE  ---------- */
export const schema = {
  users,
  SessionChatTable,
  hospitals,
  doctors,
  appointments,
};