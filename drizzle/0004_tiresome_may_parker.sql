ALTER TABLE `subscriptions` MODIFY COLUMN `status` enum('active','cancelled','expired','grace_period','blocked') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `billingPeriod` enum('monthly','yearly') DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `nextBillingDate` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `gracePeriodEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `lastPaymentDate` timestamp;