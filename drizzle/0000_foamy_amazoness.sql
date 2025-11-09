-- 1. new column on doctors
ALTER TABLE "doctors" ADD COLUMN "doctor_voice_id" varchar;

-- 2. new columns on sessionChatTable
ALTER TABLE "sessionChatTable"
  ADD COLUMN "needs_summary" integer DEFAULT 1,
  ALTER COLUMN "conversation" SET DEFAULT '[]'::jsonb;

-- 3. new index
CREATE INDEX "idx_needs_summary" ON "sessionChatTable" USING btree ("needs_summary");