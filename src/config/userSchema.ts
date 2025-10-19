// src/config/userSchema.ts
import { index } from "drizzle-orm/pg-core";
import {
  integer,
  json,
  pgTable,
  varchar,
  text,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ----------  1.  USERS (Clerk)  ---------- */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_users_clerk_id").on(table.clerkId),
]);

/* ----------  2.  AI-CHAT SESSIONS  ---------- */
export const SessionChatTable = pgTable("sessionChatTable", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("sessionId").notNull().unique(),
  note: varchar("note").notNull(),
  conversation: json("conversation")
    .$type<Record<string, any>[]>()
    .notNull(), // NO .default(sql`[]`) ─ push will fail on Neon
  selectedDoctor: json("selectedDoctor")
    .$type<{ id: string; name: string }>()
    .notNull(),
  report: json("report").$type<Record<string, any>>(), // nullable
  status: varchar("status", { enum: ["active", "completed"] }).default("active"),
  userId: varchar("userId", { length: 255 })
    .notNull()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  createdBy: varchar("createdBy", { length: 255 }),
  createdOn: timestamp("createdOn").defaultNow(),
}, (table) => [
  index("idx_session_user_created").on(table.userId, table.createdOn),
  index("idx_session_status").on(table.status),
  index("idx_session_id").on(table.sessionId),
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