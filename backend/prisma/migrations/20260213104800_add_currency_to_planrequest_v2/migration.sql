/*
  Warnings:

  - You are about to alter the column `role` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `deliverychallan` ADD COLUMN `carrier` VARCHAR(191) NULL,
    ADD COLUMN `manualReference` VARCHAR(191) NULL,
    ADD COLUMN `remarks` TEXT NULL,
    ADD COLUMN `transportNote` TEXT NULL,
    ADD COLUMN `vehicleNo` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `planrequest` ADD COLUMN `currency` VARCHAR(191) NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE `purchasebillitem` ADD COLUMN `productId` INTEGER NULL,
    ADD COLUMN `warehouseId` INTEGER NULL;

-- AlterTable
ALTER TABLE `purchaseorderitem` ADD COLUMN `warehouseId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `loginEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `roleId` INTEGER NULL,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE `voucher` ADD COLUMN `manualReceiptNo` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `voucheritem` ADD COLUMN `ledgerId` INTEGER NULL,
    ADD COLUMN `narration` TEXT NULL;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `permissions` TEXT NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `role_companyId_idx`(`companyId`),
    UNIQUE INDEX `role_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientName` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `gstin` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `client_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `joiningDate` DATETIME(3) NOT NULL,
    `salaryType` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `basicSalary` DOUBLE NOT NULL,
    `bankAccount` VARCHAR(191) NULL,
    `ifsc` VARCHAR(191) NULL,
    `taxId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `employee_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_structure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `salary_structure_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_structure_component` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `structureId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `calculationType` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,

    INDEX `salary_structure_component_structureId_idx`(`structureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salary_structure_assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `structureId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,

    UNIQUE INDEX `salary_structure_assignment_employeeId_key`(`employeeId`),
    INDEX `salary_structure_assignment_structureId_idx`(`structureId`),
    INDEX `salary_structure_assignment_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeeId` INTEGER NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `basicSalary` DOUBLE NOT NULL,
    `totalEarnings` DOUBLE NOT NULL,
    `totalDeductions` DOUBLE NOT NULL,
    `netSalary` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `remarks` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payroll_employeeId_idx`(`employeeId`),
    INDEX `payroll_companyId_idx`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_detail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payrollId` INTEGER NOT NULL,
    `componentName` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,

    INDEX `payroll_detail_payrollId_idx`(`payrollId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyId` INTEGER NOT NULL,
    `payCycle` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `bankAccount` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `taxSlab` VARCHAR(191) NULL,
    `enablePF` BOOLEAN NOT NULL DEFAULT false,
    `enableInsurance` BOOLEAN NOT NULL DEFAULT false,
    `enableOtherDeductions` BOOLEAN NOT NULL DEFAULT false,
    `layout` VARCHAR(191) NOT NULL DEFAULT 'Simple',
    `companyLogo` TEXT NULL,
    `footerNotes` TEXT NULL,
    `digitalSignature` BOOLEAN NOT NULL DEFAULT false,
    `enableEmail` BOOLEAN NOT NULL DEFAULT true,
    `enableWhatsapp` BOOLEAN NOT NULL DEFAULT false,
    `emailTemplate` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payroll_setting_companyId_key`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PurchaseBillItem_productId_fkey` ON `purchasebillitem`(`productId`);

-- CreateIndex
CREATE INDEX `PurchaseBillItem_warehouseId_fkey` ON `purchasebillitem`(`warehouseId`);

-- CreateIndex
CREATE INDEX `PurchaseOrderItem_warehouseId_fkey` ON `purchaseorderitem`(`warehouseId`);

-- AddForeignKey
ALTER TABLE `purchasebillitem` ADD CONSTRAINT `PurchaseBillItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebillitem` ADD CONSTRAINT `PurchaseBillItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorderitem` ADD CONSTRAINT `PurchaseOrderItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucheritem` ADD CONSTRAINT `voucheritem_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role` ADD CONSTRAINT `role_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client` ADD CONSTRAINT `client_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_structure` ADD CONSTRAINT `salary_structure_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_structure_component` ADD CONSTRAINT `salary_structure_component_structureId_fkey` FOREIGN KEY (`structureId`) REFERENCES `salary_structure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_structure_assignment` ADD CONSTRAINT `salary_structure_assignment_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_structure_assignment` ADD CONSTRAINT `salary_structure_assignment_structureId_fkey` FOREIGN KEY (`structureId`) REFERENCES `salary_structure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_structure_assignment` ADD CONSTRAINT `salary_structure_assignment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_detail` ADD CONSTRAINT `payroll_detail_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `payroll`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll_setting` ADD CONSTRAINT `payroll_setting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
