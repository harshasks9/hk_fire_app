-- The product is free: no plans, no billing.
ALTER TABLE "notebooks" DROP COLUMN IF EXISTS "plan";
--> statement-breakpoint
ALTER TABLE "notebooks" DROP COLUMN IF EXISTS "plan_expires_at";
--> statement-breakpoint
ALTER TABLE "notebooks" DROP COLUMN IF EXISTS "stripe_customer_id";
--> statement-breakpoint
ALTER TABLE "notebooks" DROP COLUMN IF EXISTS "stripe_subscription_id";
