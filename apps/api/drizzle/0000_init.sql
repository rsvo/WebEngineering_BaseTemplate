CREATE TABLE "bears" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"binomial" text NOT NULL,
	"image_url" text,
	"range" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bear_id" text NOT NULL,
	"author" varchar(80) NOT NULL,
	"text" varchar(1000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_bear_id_bears_id_fk" FOREIGN KEY ("bear_id") REFERENCES "public"."bears"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_bear_id_created_at_idx" ON "comments" USING btree ("bear_id","created_at");