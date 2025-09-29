/*
  Warnings:

  - You are about to drop the column `email` on the `Traveler` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Traveler` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Traveler_email_key` ON `Traveler`;

-- AlterTable
ALTER TABLE `Company` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Traveler` DROP COLUMN `email`,
    ADD COLUMN `userId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Company_userId_key` ON `Company`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `Traveler_userId_key` ON `Traveler`(`userId`);

-- AddForeignKey
ALTER TABLE `Company` ADD CONSTRAINT `Company_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Traveler` ADD CONSTRAINT `Traveler_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
