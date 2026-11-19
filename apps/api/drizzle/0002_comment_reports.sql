ALTER TABLE "comments" ADD COLUMN "report_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "hidden_at" timestamp (3) with time zone;