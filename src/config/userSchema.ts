import {
  integer,
  json,
  pgTable,
  varchar,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// --------------------------------------------------
// 1.  ORIGINAL (AI-chat) tables
// --------------------------------------------------
export const usersTable = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
});

export const SessionChatTable = pgTable("sessionChatTable", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("sessionId").notNull(),
  note: varchar("note").notNull(),
  conversation: json("conversation"),
  selectedDoctor: json("selectedDoctor"),
  report: json("report"),
  status: varchar("status").notNull(),
  createdBy: varchar("createdBy", { length: 255 }).references(() => usersTable.email),
  createdOn: varchar("createdOn").notNull(),
});

// --------------------------------------------------
// 2.  NEW (Hospital) tables
// --------------------------------------------------
export const hospitals = pgTable("hospitals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: varchar("logo"),
  contactPhone: varchar("contact_phone"),
  contactEmail: varchar("contact_email"),
  address: text("address"),
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

export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientEmail: varchar("patient_email").notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  doctorId: integer("doctor_id").references(() => doctors.id),
  date: date("date").notNull(),
  timeSlot: varchar("time_slot").notNull(),
  status: varchar("status", { enum: ["pending", "paid", "approved", "completed", "cancelled"] })
    .default("pending"),
  paystackRef: varchar("paystack_ref"),
  createdAt: timestamp("created_at").defaultNow(),
});