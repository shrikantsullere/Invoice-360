-- CreateTable
CREATE TABLE `accountgroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('ASSETS', 'LIABILITIES', 'INCOME', 'EXPENSES', 'EQUITY') NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AccountGroup_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accountsubgroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `groupId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AccountSubGroup_groupId_fkey`(`groupId`),
    UNIQUE INDEX `AccountSubGroup_companyId_groupId_name_key`(`companyId`, `groupId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bankaccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `openingBalance` DOUBLE NOT NULL DEFAULT 0,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BankAccount_companyId_accountNumber_key`(`companyId`, `accountNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banktransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bankAccountId` INTEGER NOT NULL,
    `transactionType` ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BankTransaction_bankAccountId_fkey`(`bankAccountId`),
    INDEX `BankTransaction_companyId_fkey`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `logo` LONGTEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `invoiceTemplate` VARCHAR(191) NOT NULL DEFAULT 'New York',
    `invoiceColor` VARCHAR(191) NOT NULL DEFAULT '#000000',
    `showQrCode` BOOLEAN NOT NULL DEFAULT true,
    `invoiceLogo` LONGTEXT NULL,
    `planName` VARCHAR(191) NULL,
    `planId` INTEGER NULL,
    `planType` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `zip` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL DEFAULT 'USD',
    `bankName` VARCHAR(191) NULL,
    `accountHolder` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifsc` VARCHAR(191) NULL,
    `terms` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `inventoryConfig` LONGTEXT NULL,

    UNIQUE INDEX `Company_email_key`(`email`),
    INDEX `Company_planId_fkey`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nameArabic` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `companyLocation` TEXT NULL,
    `profileImage` LONGTEXT NULL,
    `anyFile` LONGTEXT NULL,
    `accountType` VARCHAR(191) NULL,
    `balanceType` VARCHAR(191) NOT NULL DEFAULT 'Debit',
    `accountName` VARCHAR(191) NULL,
    `accountBalance` DOUBLE NOT NULL DEFAULT 0,
    `creationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankIFSC` VARCHAR(191) NULL,
    `bankNameBranch` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `creditPeriod` INTEGER NULL,
    `gstNumber` VARCHAR(191) NULL,
    `gstEnabled` BOOLEAN NOT NULL DEFAULT false,
    `billingName` VARCHAR(191) NULL,
    `billingPhone` VARCHAR(191) NULL,
    `billingAddress` TEXT NULL,
    `billingCity` VARCHAR(191) NULL,
    `billingState` VARCHAR(191) NULL,
    `billingCountry` VARCHAR(191) NULL,
    `billingZipCode` VARCHAR(191) NULL,
    `shippingSameAsBilling` BOOLEAN NOT NULL DEFAULT false,
    `shippingName` VARCHAR(191) NULL,
    `shippingPhone` VARCHAR(191) NULL,
    `shippingAddress` TEXT NULL,
    `shippingCity` VARCHAR(191) NULL,
    `shippingState` VARCHAR(191) NULL,
    `shippingCountry` VARCHAR(191) NULL,
    `shippingZipCode` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `ledgerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Customer_companyId_email_key`(`companyId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dashboardannouncement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliverychallan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanNumber` VARCHAR(191) NOT NULL,
    `manualReference` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NOT NULL,
    `salesOrderId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `shippingAddress` TEXT NULL,
    `shippingCity` VARCHAR(191) NULL,
    `shippingEmail` VARCHAR(191) NULL,
    `shippingPhone` VARCHAR(191) NULL,
    `shippingState` VARCHAR(191) NULL,
    `shippingZipCode` VARCHAR(191) NULL,
    `vehicleNo` VARCHAR(191) NULL,
    `carrier` VARCHAR(191) NULL,
    `transportNote` TEXT NULL,
    `remarks` TEXT NULL,

    INDEX `DeliveryChallan_customerId_fkey`(`customerId`),
    INDEX `DeliveryChallan_salesOrderId_fkey`(`salesOrderId`),
    UNIQUE INDEX `DeliveryChallan_companyId_challanNumber_key`(`companyId`, `challanNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliverychallanitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challanId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` TEXT NULL,

    INDEX `DeliveryChallanItem_challanId_fkey`(`challanId`),
    INDEX `DeliveryChallanItem_productId_fkey`(`productId`),
    INDEX `DeliveryChallanItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenseentry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expenseType` ENUM('DIRECT', 'INDIRECT') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExpenseEntry_companyId_fkey`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goodsreceiptnote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grnNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `vendorId` INTEGER NOT NULL,
    `purchaseOrderId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Received',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GoodsReceiptNote_purchaseOrderId_fkey`(`purchaseOrderId`),
    INDEX `GoodsReceiptNote_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `GoodsReceiptNote_companyId_grnNumber_key`(`companyId`, `grnNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goodsreceiptnoteitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grnId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GoodsReceiptNoteItem_grnId_fkey`(`grnId`),
    INDEX `GoodsReceiptNoteItem_productId_fkey`(`productId`),
    INDEX `GoodsReceiptNoteItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incomeentry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `incomeType` ENUM('PRODUCT_SALES', 'SERVICE_INCOME', 'OTHER_INCOME') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IncomeEntry_companyId_fkey`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryadjustment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voucherNo` VARCHAR(191) NOT NULL,
    `manualVoucherNo` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ADD_STOCK', 'REMOVE_STOCK', 'ADJUST_VALUE') NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `note` TEXT NULL,
    `totalValue` DOUBLE NOT NULL DEFAULT 0,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryAdjustment_warehouseId_fkey`(`warehouseId`),
    UNIQUE INDEX `InventoryAdjustment_companyId_voucherNo_key`(`companyId`, `voucherNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventoryadjustmentitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inventoryAdjustmentId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `narration` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryAdjustmentItem_inventoryAdjustmentId_fkey`(`inventoryAdjustmentId`),
    INDEX `InventoryAdjustmentItem_productId_fkey`(`productId`),
    INDEX `InventoryAdjustmentItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventorytransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('OPENING_STOCK', 'TRANSFER', 'ADJUSTMENT', 'PURCHASE', 'SALE', 'RETURN', 'GRN') NOT NULL,
    `productId` INTEGER NOT NULL,
    `fromWarehouseId` INTEGER NULL,
    `toWarehouseId` INTEGER NULL,
    `quantity` DOUBLE NOT NULL,
    `reason` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryTransaction_companyId_fkey`(`companyId`),
    INDEX `InventoryTransaction_fromWarehouseId_fkey`(`fromWarehouseId`),
    INDEX `InventoryTransaction_productId_fkey`(`productId`),
    INDEX `InventoryTransaction_toWarehouseId_fkey`(`toWarehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `customerId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `balanceAmount` DOUBLE NOT NULL,
    `status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    `salesOrderId` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveryChallanId` INTEGER NULL,

    INDEX `Invoice_customerId_fkey`(`customerId`),
    INDEX `Invoice_deliveryChallanId_fkey`(`deliveryChallanId`),
    INDEX `Invoice_salesOrderId_fkey`(`salesOrderId`),
    UNIQUE INDEX `Invoice_companyId_invoiceNumber_key`(`companyId`, `invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoiceitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `warehouseId` INTEGER NULL,

    INDEX `InvoiceItem_invoiceId_fkey`(`invoiceId`),
    INDEX `InvoiceItem_productId_fkey`(`productId`),
    INDEX `InvoiceItem_serviceId_fkey`(`serviceId`),
    INDEX `InvoiceItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journalentry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `voucherNumber` VARCHAR(191) NOT NULL,
    `narration` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `JournalEntry_companyId_voucherNumber_key`(`companyId`, `voucherNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `groupId` INTEGER NOT NULL,
    `subGroupId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `openingBalance` DOUBLE NOT NULL DEFAULT 0,
    `currentBalance` DOUBLE NOT NULL DEFAULT 0,
    `isControlAccount` BOOLEAN NOT NULL DEFAULT false,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `parentLedgerId` INTEGER NULL,
    `customerId` INTEGER NULL,
    `vendorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Ledger_customerId_key`(`customerId`),
    UNIQUE INDEX `Ledger_vendorId_key`(`vendorId`),
    INDEX `Ledger_groupId_fkey`(`groupId`),
    INDEX `Ledger_parentLedgerId_fkey`(`parentLedgerId`),
    INDEX `Ledger_subGroupId_fkey`(`subGroupId`),
    UNIQUE INDEX `Ledger_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordrequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PasswordRequest_companyId_fkey`(`companyId`),
    INDEX `PasswordRequest_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `vendorId` INTEGER NOT NULL,
    `purchaseBillId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER') NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payment_purchaseBillId_fkey`(`purchaseBillId`),
    INDEX `Payment_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `Payment_companyId_paymentNumber_key`(`companyId`, `paymentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentrecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customer` VARCHAR(191) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PaymentRecord_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `basePrice` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `invoiceLimit` VARCHAR(191) NOT NULL DEFAULT '0',
    `additionalInvoicePrice` DOUBLE NOT NULL DEFAULT 0,
    `userLimit` VARCHAR(191) NOT NULL DEFAULT '0',
    `storageCapacity` VARCHAR(191) NOT NULL DEFAULT '0',
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `modules` LONGTEXT NULL,
    `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    `descriptions` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planrequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `companyName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `planId` INTEGER NULL,
    `planName` VARCHAR(191) NULL,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'Monthly',
    `startDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlanRequest_planId_fkey`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posinvoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `balanceAmount` DOUBLE NOT NULL DEFAULT 0,
    `paymentMode` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Paid',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PosInvoice_customerId_fkey`(`customerId`),
    UNIQUE INDEX `PosInvoice_companyId_invoiceNumber_key`(`companyId`, `invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posinvoiceitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `posInvoiceId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `warehouseId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PosInvoiceItem_posInvoiceId_fkey`(`posInvoiceId`),
    INDEX `PosInvoiceItem_productId_fkey`(`productId`),
    INDEX `PosInvoiceItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `hsn` VARCHAR(191) NULL,
    `barcode` VARCHAR(191) NULL,
    `image` LONGTEXT NULL,
    `categoryId` INTEGER NULL,
    `uomId` INTEGER NULL,
    `unit` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `asOfDate` DATETIME(3) NULL,
    `taxAccount` VARCHAR(191) NULL,
    `initialCost` DOUBLE NOT NULL DEFAULT 0,
    `salePrice` DOUBLE NOT NULL DEFAULT 0,
    `purchasePrice` DOUBLE NOT NULL DEFAULT 0,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `remarks` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Product_categoryId_fkey`(`categoryId`),
    INDEX `Product_uomId_fkey`(`uomId`),
    UNIQUE INDEX `Product_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasebill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `vendorId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `balanceAmount` DOUBLE NOT NULL,
    `status` ENUM('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'UNPAID',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `grnId` INTEGER NULL,
    `purchaseOrderId` INTEGER NULL,

    INDEX `PurchaseBill_grnId_fkey`(`grnId`),
    INDEX `PurchaseBill_purchaseOrderId_fkey`(`purchaseOrderId`),
    INDEX `PurchaseBill_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `PurchaseBill_companyId_billNumber_key`(`companyId`, `billNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasebillitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseBillId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `warehouseId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PurchaseBillItem_purchaseBillId_fkey`(`purchaseBillId`),
    INDEX `PurchaseBillItem_productId_fkey`(`productId`),
    INDEX `PurchaseBillItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchaseorder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedDate` DATETIME(3) NULL,
    `vendorId` INTEGER NOT NULL,
    `quotationId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PurchaseOrder_quotationId_key`(`quotationId`),
    INDEX `PurchaseOrder_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `PurchaseOrder_companyId_orderNumber_key`(`companyId`, `orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchaseorderitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `warehouseId` INTEGER NULL,

    INDEX `PurchaseOrderItem_orderId_fkey`(`orderId`),
    INDEX `PurchaseOrderItem_productId_fkey`(`productId`),
    INDEX `PurchaseOrderItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasequotation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotationNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `vendorId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `attachments` TEXT NULL,
    `manualReference` VARCHAR(191) NULL,
    `terms` TEXT NULL,

    INDEX `PurchaseQuotation_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `PurchaseQuotation_companyId_quotationNumber_key`(`companyId`, `quotationNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasequotationitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotationId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `warehouseId` INTEGER NULL,

    INDEX `PurchaseQuotationItem_productId_fkey`(`productId`),
    INDEX `PurchaseQuotationItem_quotationId_fkey`(`quotationId`),
    INDEX `PurchaseQuotationItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasereturn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `returnNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `vendorId` INTEGER NOT NULL,
    `purchaseBillId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('Pending', 'Processed', 'Rejected', 'Draft') NOT NULL DEFAULT 'Pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PurchaseReturn_purchaseBillId_fkey`(`purchaseBillId`),
    INDEX `PurchaseReturn_vendorId_fkey`(`vendorId`),
    UNIQUE INDEX `PurchaseReturn_companyId_returnNumber_key`(`companyId`, `returnNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchasereturnitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseReturnId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PurchaseReturnItem_productId_fkey`(`productId`),
    INDEX `PurchaseReturnItem_purchaseReturnId_fkey`(`purchaseReturnId`),
    INDEX `PurchaseReturnItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `receipt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NOT NULL,
    `invoiceId` INTEGER NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMode` ENUM('CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER') NOT NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Receipt_customerId_fkey`(`customerId`),
    INDEX `Receipt_invoiceId_fkey`(`invoiceId`),
    UNIQUE INDEX `Receipt_companyId_receiptNumber_key`(`companyId`, `receiptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesorder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedDate` DATETIME(3) NULL,
    `customerId` INTEGER NOT NULL,
    `quotationId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SalesOrder_quotationId_key`(`quotationId`),
    INDEX `SalesOrder_customerId_fkey`(`customerId`),
    UNIQUE INDEX `SalesOrder_companyId_orderNumber_key`(`companyId`, `orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesorderitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `warehouseId` INTEGER NULL,

    INDEX `SalesOrderItem_orderId_fkey`(`orderId`),
    INDEX `SalesOrderItem_productId_fkey`(`productId`),
    INDEX `SalesOrderItem_serviceId_fkey`(`serviceId`),
    INDEX `SalesOrderItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesquotation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotationNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `customerId` INTEGER NOT NULL,
    `companyId` INTEGER NOT NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SalesQuotation_customerId_fkey`(`customerId`),
    UNIQUE INDEX `SalesQuotation_companyId_quotationNumber_key`(`companyId`, `quotationNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesquotationitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quotationId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `discount` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `warehouseId` INTEGER NULL,

    INDEX `SalesQuotationItem_productId_fkey`(`productId`),
    INDEX `SalesQuotationItem_quotationId_fkey`(`quotationId`),
    INDEX `SalesQuotationItem_serviceId_fkey`(`serviceId`),
    INDEX `SalesQuotationItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesreturn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `returnNumber` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NOT NULL,
    `invoiceId` INTEGER NULL,
    `companyId` INTEGER NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `autoVoucherNo` VARCHAR(191) NULL,
    `manualVoucherNo` VARCHAR(191) NULL,
    `status` ENUM('Pending', 'Processed', 'Rejected', 'Draft') NOT NULL DEFAULT 'Pending',

    INDEX `SalesReturn_customerId_fkey`(`customerId`),
    INDEX `SalesReturn_invoiceId_fkey`(`invoiceId`),
    UNIQUE INDEX `SalesReturn_companyId_returnNumber_key`(`companyId`, `returnNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesreturnitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesReturnId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SalesReturnItem_productId_fkey`(`productId`),
    INDEX `SalesReturnItem_salesReturnId_fkey`(`salesReturnId`),
    INDEX `SalesReturnItem_warehouseId_fkey`(`warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `uomId` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `allowInInvoices` BOOLEAN NOT NULL DEFAULT true,
    `remarks` TEXT NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Service_uomId_fkey`(`uomId`),
    UNIQUE INDEX `Service_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouseId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `minOrderQty` DOUBLE NOT NULL DEFAULT 0,
    `initialQty` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reservedQuantity` DOUBLE NOT NULL DEFAULT 0,

    INDEX `Stock_productId_fkey`(`productId`),
    UNIQUE INDEX `Stock_warehouseId_productId_key`(`warehouseId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocktransfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voucherNo` VARCHAR(191) NOT NULL,
    `manualVoucherNo` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `toWarehouseId` INTEGER NOT NULL,
    `narration` TEXT NULL,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockTransfer_toWarehouseId_fkey`(`toWarehouseId`),
    UNIQUE INDEX `StockTransfer_companyId_voucherNo_key`(`companyId`, `voucherNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocktransferitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stockTransferId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `fromWarehouseId` INTEGER NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `rate` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `narration` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockTransferItem_fromWarehouseId_fkey`(`fromWarehouseId`),
    INDEX `StockTransferItem_productId_fkey`(`productId`),
    INDEX `StockTransferItem_stockTransferId_fkey`(`stockTransferId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `debitLedgerId` INTEGER NOT NULL,
    `creditLedgerId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `narration` TEXT NULL,
    `voucherType` ENUM('JOURNAL', 'SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'CONTRA', 'EXPENSE', 'INCOME', 'QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'SALES_RETURN', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PURCHASE_QUOTATION', 'PURCHASE_ORDER', 'GRN', 'PURCHASE_RETURN', 'POS_INVOICE') NOT NULL,
    `voucherNumber` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `journalEntryId` INTEGER NULL,
    `invoiceId` INTEGER NULL,
    `purchaseBillId` INTEGER NULL,
    `receiptId` INTEGER NULL,
    `paymentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `posInvoiceId` INTEGER NULL,

    INDEX `Transaction_companyId_fkey`(`companyId`),
    INDEX `Transaction_creditLedgerId_fkey`(`creditLedgerId`),
    INDEX `Transaction_debitLedgerId_fkey`(`debitLedgerId`),
    INDEX `Transaction_invoiceId_fkey`(`invoiceId`),
    INDEX `Transaction_journalEntryId_fkey`(`journalEntryId`),
    INDEX `Transaction_paymentId_fkey`(`paymentId`),
    INDEX `Transaction_posInvoiceId_fkey`(`posInvoiceId`),
    INDEX `Transaction_purchaseBillId_fkey`(`purchaseBillId`),
    INDEX `Transaction_receiptId_fkey`(`receiptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `unitName` VARCHAR(191) NOT NULL,
    `weightPerUnit` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UOM_companyId_category_unitName_key`(`companyId`, `category`, `unitName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `roleId` INTEGER NULL,
    `loginEnabled` BOOLEAN NOT NULL DEFAULT true,
    `companyId` INTEGER NULL,
    `avatar` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_companyId_fkey`(`companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nameArabic` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `companyLocation` TEXT NULL,
    `profileImage` LONGTEXT NULL,
    `anyFile` LONGTEXT NULL,
    `accountType` VARCHAR(191) NULL,
    `balanceType` VARCHAR(191) NOT NULL DEFAULT 'Credit',
    `accountName` VARCHAR(191) NULL,
    `accountBalance` DOUBLE NOT NULL DEFAULT 0,
    `creationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankIFSC` VARCHAR(191) NULL,
    `bankNameBranch` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `creditPeriod` INTEGER NULL,
    `gstNumber` VARCHAR(191) NULL,
    `gstEnabled` BOOLEAN NOT NULL DEFAULT false,
    `billingName` VARCHAR(191) NULL,
    `billingPhone` VARCHAR(191) NULL,
    `billingAddress` TEXT NULL,
    `billingCity` VARCHAR(191) NULL,
    `billingState` VARCHAR(191) NULL,
    `billingCountry` VARCHAR(191) NULL,
    `billingZipCode` VARCHAR(191) NULL,
    `shippingSameAsBilling` BOOLEAN NOT NULL DEFAULT false,
    `shippingName` VARCHAR(191) NULL,
    `shippingPhone` VARCHAR(191) NULL,
    `shippingAddress` TEXT NULL,
    `shippingCity` VARCHAR(191) NULL,
    `shippingState` VARCHAR(191) NULL,
    `shippingCountry` VARCHAR(191) NULL,
    `shippingZipCode` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `ledgerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Vendor_companyId_email_key`(`companyId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `addressLine1` VARCHAR(191) NULL,
    `addressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `companyId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Warehouse_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voucher` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voucherNumber` VARCHAR(191) NOT NULL,
    `manualReceiptNo` VARCHAR(191) NULL,
    `voucherType` ENUM('EXPENSE', 'INCOME', 'CONTRA') NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `companyId` INTEGER NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `logo` LONGTEXT NULL,
    `paidFromLedgerId` INTEGER NULL,
    `paidToLedgerId` INTEGER NULL,
    `paidFromAccount` VARCHAR(191) NULL,
    `paidToParty` VARCHAR(191) NULL,
    `vendorId` INTEGER NULL,
    `customerId` INTEGER NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `signature` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `voucher_vendorId_idx`(`vendorId`),
    INDEX `voucher_customerId_idx`(`customerId`),
    INDEX `voucher_paidFromLedgerId_idx`(`paidFromLedgerId`),
    INDEX `voucher_paidToLedgerId_idx`(`paidToLedgerId`),
    UNIQUE INDEX `voucher_companyId_voucherNumber_key`(`companyId`, `voucherNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voucheritem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `voucherId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `ledgerId` INTEGER NULL,
    `productName` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `quantity` DOUBLE NOT NULL DEFAULT 1,
    `rate` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `narration` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `voucheritem_voucherId_idx`(`voucherId`),
    INDEX `voucheritem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- AddForeignKey
ALTER TABLE `accountgroup` ADD CONSTRAINT `AccountGroup_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accountsubgroup` ADD CONSTRAINT `AccountSubGroup_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accountsubgroup` ADD CONSTRAINT `AccountSubGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `accountgroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bankaccount` ADD CONSTRAINT `BankAccount_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banktransaction` ADD CONSTRAINT `BankTransaction_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankaccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banktransaction` ADD CONSTRAINT `BankTransaction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `Category_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company` ADD CONSTRAINT `Company_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer` ADD CONSTRAINT `Customer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallan` ADD CONSTRAINT `DeliveryChallan_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallan` ADD CONSTRAINT `DeliveryChallan_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallan` ADD CONSTRAINT `DeliveryChallan_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `salesorder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallanitem` ADD CONSTRAINT `DeliveryChallanItem_challanId_fkey` FOREIGN KEY (`challanId`) REFERENCES `deliverychallan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallanitem` ADD CONSTRAINT `DeliveryChallanItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverychallanitem` ADD CONSTRAINT `DeliveryChallanItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenseentry` ADD CONSTRAINT `ExpenseEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnote` ADD CONSTRAINT `GoodsReceiptNote_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnote` ADD CONSTRAINT `GoodsReceiptNote_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchaseorder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnote` ADD CONSTRAINT `GoodsReceiptNote_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnoteitem` ADD CONSTRAINT `GoodsReceiptNoteItem_grnId_fkey` FOREIGN KEY (`grnId`) REFERENCES `goodsreceiptnote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnoteitem` ADD CONSTRAINT `GoodsReceiptNoteItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goodsreceiptnoteitem` ADD CONSTRAINT `GoodsReceiptNoteItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incomeentry` ADD CONSTRAINT `IncomeEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustment` ADD CONSTRAINT `InventoryAdjustment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustment` ADD CONSTRAINT `InventoryAdjustment_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustmentitem` ADD CONSTRAINT `InventoryAdjustmentItem_inventoryAdjustmentId_fkey` FOREIGN KEY (`inventoryAdjustmentId`) REFERENCES `inventoryadjustment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustmentitem` ADD CONSTRAINT `InventoryAdjustmentItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventoryadjustmentitem` ADD CONSTRAINT `InventoryAdjustmentItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventorytransaction` ADD CONSTRAINT `InventoryTransaction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventorytransaction` ADD CONSTRAINT `InventoryTransaction_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventorytransaction` ADD CONSTRAINT `InventoryTransaction_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventorytransaction` ADD CONSTRAINT `InventoryTransaction_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_deliveryChallanId_fkey` FOREIGN KEY (`deliveryChallanId`) REFERENCES `deliverychallan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `Invoice_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `salesorder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoiceitem` ADD CONSTRAINT `InvoiceItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journalentry` ADD CONSTRAINT `JournalEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `accountgroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_parentLedgerId_fkey` FOREIGN KEY (`parentLedgerId`) REFERENCES `ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_subGroupId_fkey` FOREIGN KEY (`subGroupId`) REFERENCES `accountsubgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ledger` ADD CONSTRAINT `Ledger_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordrequest` ADD CONSTRAINT `PasswordRequest_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passwordrequest` ADD CONSTRAINT `PasswordRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `Payment_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `Payment_purchaseBillId_fkey` FOREIGN KEY (`purchaseBillId`) REFERENCES `purchasebill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `Payment_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planrequest` ADD CONSTRAINT `PlanRequest_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posinvoice` ADD CONSTRAINT `PosInvoice_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posinvoice` ADD CONSTRAINT `PosInvoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posinvoiceitem` ADD CONSTRAINT `PosInvoiceItem_posInvoiceId_fkey` FOREIGN KEY (`posInvoiceId`) REFERENCES `posinvoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posinvoiceitem` ADD CONSTRAINT `PosInvoiceItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posinvoiceitem` ADD CONSTRAINT `PosInvoiceItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `Product_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `Product_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebill` ADD CONSTRAINT `PurchaseBill_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebill` ADD CONSTRAINT `PurchaseBill_grnId_fkey` FOREIGN KEY (`grnId`) REFERENCES `goodsreceiptnote`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebill` ADD CONSTRAINT `PurchaseBill_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchaseorder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebill` ADD CONSTRAINT `PurchaseBill_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebillitem` ADD CONSTRAINT `PurchaseBillItem_purchaseBillId_fkey` FOREIGN KEY (`purchaseBillId`) REFERENCES `purchasebill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebillitem` ADD CONSTRAINT `PurchaseBillItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasebillitem` ADD CONSTRAINT `PurchaseBillItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorder` ADD CONSTRAINT `PurchaseOrder_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorder` ADD CONSTRAINT `PurchaseOrder_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `purchasequotation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorder` ADD CONSTRAINT `PurchaseOrder_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorderitem` ADD CONSTRAINT `PurchaseOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `purchaseorder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorderitem` ADD CONSTRAINT `PurchaseOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchaseorderitem` ADD CONSTRAINT `PurchaseOrderItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasequotation` ADD CONSTRAINT `PurchaseQuotation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasequotation` ADD CONSTRAINT `PurchaseQuotation_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasequotationitem` ADD CONSTRAINT `PurchaseQuotationItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasequotationitem` ADD CONSTRAINT `PurchaseQuotationItem_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `purchasequotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasequotationitem` ADD CONSTRAINT `PurchaseQuotationItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturn` ADD CONSTRAINT `PurchaseReturn_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturn` ADD CONSTRAINT `PurchaseReturn_purchaseBillId_fkey` FOREIGN KEY (`purchaseBillId`) REFERENCES `purchasebill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturn` ADD CONSTRAINT `PurchaseReturn_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturnitem` ADD CONSTRAINT `PurchaseReturnItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturnitem` ADD CONSTRAINT `PurchaseReturnItem_purchaseReturnId_fkey` FOREIGN KEY (`purchaseReturnId`) REFERENCES `purchasereturn`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchasereturnitem` ADD CONSTRAINT `PurchaseReturnItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipt` ADD CONSTRAINT `Receipt_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipt` ADD CONSTRAINT `Receipt_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `receipt` ADD CONSTRAINT `Receipt_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorder` ADD CONSTRAINT `SalesOrder_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorder` ADD CONSTRAINT `SalesOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorder` ADD CONSTRAINT `SalesOrder_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `salesquotation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorderitem` ADD CONSTRAINT `SalesOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `salesorder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorderitem` ADD CONSTRAINT `SalesOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorderitem` ADD CONSTRAINT `SalesOrderItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesorderitem` ADD CONSTRAINT `SalesOrderItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotation` ADD CONSTRAINT `SalesQuotation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotation` ADD CONSTRAINT `SalesQuotation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotationitem` ADD CONSTRAINT `SalesQuotationItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotationitem` ADD CONSTRAINT `SalesQuotationItem_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `salesquotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotationitem` ADD CONSTRAINT `SalesQuotationItem_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesquotationitem` ADD CONSTRAINT `SalesQuotationItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturn` ADD CONSTRAINT `SalesReturn_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturn` ADD CONSTRAINT `SalesReturn_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturn` ADD CONSTRAINT `SalesReturn_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturnitem` ADD CONSTRAINT `SalesReturnItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturnitem` ADD CONSTRAINT `SalesReturnItem_salesReturnId_fkey` FOREIGN KEY (`salesReturnId`) REFERENCES `salesreturn`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salesreturnitem` ADD CONSTRAINT `SalesReturnItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `Service_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `Service_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `Stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock` ADD CONSTRAINT `Stock_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransfer` ADD CONSTRAINT `StockTransfer_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransfer` ADD CONSTRAINT `StockTransfer_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransferitem` ADD CONSTRAINT `StockTransferItem_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransferitem` ADD CONSTRAINT `StockTransferItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stocktransferitem` ADD CONSTRAINT `StockTransferItem_stockTransferId_fkey` FOREIGN KEY (`stockTransferId`) REFERENCES `stocktransfer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_creditLedgerId_fkey` FOREIGN KEY (`creditLedgerId`) REFERENCES `ledger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_debitLedgerId_fkey` FOREIGN KEY (`debitLedgerId`) REFERENCES `ledger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `journalentry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_posInvoiceId_fkey` FOREIGN KEY (`posInvoiceId`) REFERENCES `posinvoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_purchaseBillId_fkey` FOREIGN KEY (`purchaseBillId`) REFERENCES `purchasebill`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction` ADD CONSTRAINT `Transaction_receiptId_fkey` FOREIGN KEY (`receiptId`) REFERENCES `receipt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uom` ADD CONSTRAINT `UOM_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `User_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor` ADD CONSTRAINT `Vendor_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `Warehouse_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher` ADD CONSTRAINT `voucher_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher` ADD CONSTRAINT `voucher_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher` ADD CONSTRAINT `voucher_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher` ADD CONSTRAINT `voucher_paidFromLedgerId_fkey` FOREIGN KEY (`paidFromLedgerId`) REFERENCES `ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucher` ADD CONSTRAINT `voucher_paidToLedgerId_fkey` FOREIGN KEY (`paidToLedgerId`) REFERENCES `ledger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucheritem` ADD CONSTRAINT `voucheritem_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `voucher`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voucheritem` ADD CONSTRAINT `voucheritem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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


-- Seed Data
INSERT INTO `company` (`id`, `name`, `email`, `phone`, `address`, `city`, `state`, `zip`, `country`, `currency`, `createdAt`, `updatedAt`) VALUES (1, 'Demo Company', 'company@gmail.com', '+1 234 567 890', '123 Business Street', 'New York', 'NY', '10001', 'United States', 'USD', NOW(3), NOW(3));
INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `companyId`, `createdAt`, `updatedAt`) VALUES (1, 'Super Admin', 'superadmin@gmail.com', '$2b$10$4HXu2ZcLJ9QHfyadt3uLvuaDDRYExKxVy9RrtmJOSmrUtW1nv.4VQi', 'SUPERADMIN', NULL, NOW(3), NOW(3));
INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `companyId`, `createdAt`, `updatedAt`) VALUES (2, 'Company Admin', 'company@gmail.com', '$2b$10$4HXu2ZcLJ9QHfyadt3uLvuaDDRYExKxVy9RrtmJOSmrUtW1nv.4VQi', 'COMPANY', 1, NOW(3), NOW(3));
