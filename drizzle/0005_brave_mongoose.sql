ALTER TABLE "users" ADD COLUMN "verify_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verify_token_expiry" timestamp;