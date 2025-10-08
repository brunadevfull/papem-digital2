CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"active" boolean DEFAULT true NOT NULL,
	"upload_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "duty_officers" (
	"id" serial PRIMARY KEY NOT NULL,
	"officer_name" text DEFAULT '' NOT NULL,
	"master_name" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "military_personnel" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rank" text NOT NULL,
	"type" text NOT NULL,
	"specialty" text,
	"full_rank_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"priority" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
