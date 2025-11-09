ALTER TABLE "sessionChatTable" ADD COLUMN "language" varchar(10) DEFAULT 'english';--> statement-breakpoint
ALTER TABLE "sessionChatTable" ADD COLUMN "confidence" real DEFAULT 0.85;