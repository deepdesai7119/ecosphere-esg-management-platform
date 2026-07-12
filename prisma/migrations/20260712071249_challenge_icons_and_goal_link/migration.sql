-- AlterTable
ALTER TABLE `Category` ADD COLUMN `icon` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Challenge` ADD COLUMN `goalContribution` DECIMAL(18, 4) NULL,
    ADD COLUMN `goalId` VARCHAR(191) NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Challenge` ADD CONSTRAINT `Challenge_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `EnvironmentalGoal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
