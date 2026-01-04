CREATE TABLE `savedStudies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`toolName` varchar(100) NOT NULL,
	`input` text NOT NULL,
	`output` text NOT NULL,
	`creditCost` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedStudies_id` PRIMARY KEY(`id`)
);
