DROP INDEX "comments_bear_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
CREATE INDEX "comments_bear_id_created_at_id_idx" ON "comments" USING btree ("bear_id","created_at","id");