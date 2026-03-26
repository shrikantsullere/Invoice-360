const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Customer with Automatic Ledger Creation
const createCustomer = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const customerData = req.body;

        // Extract file URLs from Cloudinary upload
        const profileImage = req.files?.profileImage?.[0]?.path || customerData.profileImage;
        const anyFile = req.files?.anyFile?.[0]?.path || customerData.anyFile;

        // Validate required fields
        if (!customerData.name) {
            return res.status(400).json({
                success: false,
                message: 'Customer name is required'
            });
        }

        // Find Accounts Receivable SubGroup
        const accountsReceivableSubGroup = await prisma.accountsubgroup.findFirst({
            where: {
                companyId: companyId,
                name: 'Accounts Receivable'
            },
            include: {
                accountgroup: true
            }
        });

        if (!accountsReceivableSubGroup) {
            return res.status(404).json({
                success: false,
                message: 'Accounts Receivable sub-group not found. Please initialize Chart of Accounts first.'
            });
        }

        // Create Customer and Ledger in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Ledger first
            const ledgerName = customerData.companyName || customerData.name;
            const ledger = await tx.ledger.create({
                data: {
                    name: ledgerName,
                    groupId: accountsReceivableSubGroup.groupId,
                    subGroupId: accountsReceivableSubGroup.id,
                    companyId: companyId,
                    openingBalance: parseFloat(customerData.accountBalance) || 0,
                    currentBalance: parseFloat(customerData.accountBalance) || 0,
                    isControlAccount: false,
                    isEnabled: true,
                    description: `Customer Ledger for ${ledgerName}`
                }
            });

            // Create Customer
            const customer = await tx.customer.create({
                data: {
                    name: customerData.name,
                    nameArabic: customerData.nameArabic,
                    companyName: customerData.companyName,
                    companyLocation: customerData.companyLocation,
                    profileImage: profileImage,
                    anyFile: anyFile,
                    accountType: customerData.accountType,
                    balanceType: customerData.balanceType || 'Debit',
                    accountName: ledgerName,
                    accountBalance: parseFloat(customerData.accountBalance) || 0,
                    creationDate: customerData.creationDate ? new Date(customerData.creationDate) : new Date(),
                    bankAccountNumber: customerData.bankAccountNumber,
                    bankIFSC: customerData.bankIFSC,
                    bankNameBranch: customerData.bankNameBranch,
                    phone: customerData.phone,
                    email: customerData.email,
                    creditPeriod: customerData.creditPeriod ? parseInt(customerData.creditPeriod) : null,
                    gstNumber: customerData.gstNumber,
                    gstEnabled: customerData.gstEnabled === 'true' || customerData.gstEnabled === true,

                    // Billing Address
                    billingName: customerData.billingName,
                    billingPhone: customerData.billingPhone,
                    billingAddress: customerData.billingAddress,
                    billingCity: customerData.billingCity,
                    billingState: customerData.billingState,
                    billingCountry: customerData.billingCountry,
                    billingZipCode: customerData.billingZipCode,

                    // Shipping Address
                    shippingSameAsBilling: customerData.shippingSameAsBilling === 'true' || customerData.shippingSameAsBilling === true,
                    shippingName: customerData.shippingName,
                    shippingPhone: customerData.shippingPhone,
                    shippingAddress: customerData.shippingAddress,
                    shippingCity: customerData.shippingCity,
                    shippingState: customerData.shippingState,
                    shippingCountry: customerData.shippingCountry,
                    shippingZipCode: customerData.shippingZipCode,

                    companyId: companyId,
                    ledgerId: ledger.id
                }
            });

            // Update Ledger with customerId
            await tx.ledger.update({
                where: { id: ledger.id },
                data: { customerId: customer.id }
            });

            return { customer, ledger };
        });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully with linked ledger',
            data: result
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create customer'
        });
    }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const customers = await prisma.customer.findMany({
            where: { companyId },
            include: {
                ledger: true,
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true,
                        balanceAmount: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers'
        });
    }
};

// Get Customer by ID
const getCustomerById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            },
            include: {
                ledger: true,
                salesquotation: true,
                salesorder: true,
                deliverychallan: true,
                invoice: {
                    include: {
                        invoiceitem: true,
                        receipt: true
                    }
                },
                receipt: true
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer'
        });
    }
};

// Update Customer
const updateCustomer = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const customerData = req.body;

        // Extract file URLs from Cloudinary upload
        const profileImage = req.files?.profileImage?.[0]?.path || customerData.profileImage;
        const anyFile = req.files?.anyFile?.[0]?.path || customerData.anyFile;

        // Check if customer exists
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            },
            include: { ledger: true }
        });

        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update Customer
            const customer = await tx.customer.update({
                where: { id: parseInt(id) },
                data: {
                    name: customerData.name,
                    nameArabic: customerData.nameArabic,
                    companyName: customerData.companyName,
                    companyLocation: customerData.companyLocation,
                    profileImage: profileImage,
                    anyFile: anyFile,
                    accountType: customerData.accountType,
                    balanceType: customerData.balanceType,
                    accountBalance: parseFloat(customerData.accountBalance) || 0,
                    bankAccountNumber: customerData.bankAccountNumber,
                    bankIFSC: customerData.bankIFSC,
                    bankNameBranch: customerData.bankNameBranch,
                    phone: customerData.phone,
                    email: customerData.email,
                    creditPeriod: customerData.creditPeriod ? parseInt(customerData.creditPeriod) : null,
                    gstNumber: customerData.gstNumber,
                    gstEnabled: customerData.gstEnabled === 'true' || customerData.gstEnabled === true,

                    // Billing Address
                    billingName: customerData.billingName,
                    billingPhone: customerData.billingPhone,
                    billingAddress: customerData.billingAddress,
                    billingCity: customerData.billingCity,
                    billingState: customerData.billingState,
                    billingCountry: customerData.billingCountry,
                    billingZipCode: customerData.billingZipCode,

                    // Shipping Address
                    shippingSameAsBilling: customerData.shippingSameAsBilling === 'true' || customerData.shippingSameAsBilling === true,
                    shippingName: customerData.shippingName,
                    shippingPhone: customerData.shippingPhone,
                    shippingAddress: customerData.shippingAddress,
                    shippingCity: customerData.shippingCity,
                    shippingState: customerData.shippingState,
                    shippingCountry: customerData.shippingCountry,
                    shippingZipCode: customerData.shippingZipCode
                }
            });

            // Update Ledger name if customer/company name changed
            if (existingCustomer.ledgerId) {
                const newLedgerName = customerData.companyName || customerData.name;
                await tx.ledger.update({
                    where: { id: existingCustomer.ledgerId },
                    data: {
                        name: newLedgerName,
                        description: `Customer Ledger for ${newLedgerName}`
                    }
                });
            }

            return customer;
        });

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update customer'
        });
    }
};

// Get Customer Statement (Ledger History)
const getCustomerStatement = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, invoiceId } = req.query;
        const companyId = req.user.companyId;

        const customer = await prisma.customer.findFirst({
            where: { id: parseInt(id), companyId: companyId },
            include: { ledger: true }
        });

        if (!customer || !customer.ledgerId) {
            return res.status(404).json({ success: false, message: 'Customer or Ledger not found' });
        }

        const dateRange = {};
        if (startDate) dateRange.gte = new Date(startDate);
        if (endDate) dateRange.lte = new Date(endDate);

        const whereClause = {
            companyId: companyId,
            date: Object.keys(dateRange).length > 0 ? dateRange : undefined,
            OR: [
                { debitLedgerId: customer.ledgerId },
                { creditLedgerId: customer.ledgerId }
            ]
        };

        if (invoiceId) {
            whereClause.invoiceId = parseInt(invoiceId);
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                invoice: { select: { invoiceNumber: true, totalAmount: true } },
                receipt: { select: { receiptNumber: true, amount: true } },
                journalentry: true
            },
            orderBy: { date: 'asc' }
        });

        // Calculate Statements with Running Balance
        let runningBalance = invoiceId ? 0 : customer.ledger.openingBalance;
        const statement = transactions.map(tx => {
            const isDebit = tx.debitLedgerId === customer.ledgerId;
            const amount = tx.amount;

            // For Customers (Assets), Debit increases (+) and Credit decreases (-)
            if (isDebit) {
                runningBalance += amount;
            } else {
                runningBalance -= amount;
            }

            return {
                id: tx.id,
                date: tx.date,
                voucherType: tx.voucherType,
                voucherNumber: tx.voucherNumber,
                narration: tx.narration,
                debit: isDebit ? amount : 0,
                credit: !isDebit ? amount : 0,
                balance: runningBalance,
                referenceDoc: tx.invoice || tx.receipt || null
            };
        });

        res.status(200).json({
            success: true,
            data: {
                customer: {
                    name: customer.name,
                    ledgerName: customer.ledger.name,
                    openingBalance: customer.ledger.openingBalance
                },
                statement
            }
        });
    } catch (error) {
        console.error('Statement Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        // Check if customer exists
        const customer = await prisma.customer.findFirst({
            where: {
                id: parseInt(id),
                companyId: companyId
            },
            include: {
                invoice: true,
                salesorder: true,
                salesquotation: true,
                receipt: true,
                deliverychallan: true,
                ledger: true
            }
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check for dependencies
        const dependencies = [];
        if (customer.invoice && customer.invoice.length > 0) dependencies.push('invoices');
        if (customer.salesorder && customer.salesorder.length > 0) dependencies.push('sales orders');
        if (customer.salesquotation && customer.salesquotation.length > 0) dependencies.push('sales quotations');
        if (customer.receipt && customer.receipt.length > 0) dependencies.push('receipts');
        if (customer.deliverychallan && customer.deliverychallan.length > 0) dependencies.push('delivery challans');

        if (dependencies.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer with existing ${dependencies.join(', ')}. Please delete them first.`
            });
        }

        // Delete in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Nullify references to avoid FK constraints during deletion
            if (customer.ledgerId) {
                // Update customer to remove ledger reference
                await tx.customer.update({
                    where: { id: customer.id },
                    data: { ledgerId: null }
                });

                // Update ledger to remove customer reference
                await tx.ledger.update({
                    where: { id: customer.ledgerId },
                    data: { customerId: null }
                });
            }

            // 2. Delete Customer
            await tx.customer.delete({
                where: { id: customer.id }
            });

            // 3. Delete associated Ledger if exists
            if (customer.ledgerId) {
                await tx.ledger.delete({
                    where: { id: customer.ledgerId }
                });
            }
        });

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer details:', error);
        res.status(500).json({
            success: false,
            message: `Failed to delete customer: ${error.message}`
        });
    }
};

module.exports = {
    createCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerStatement
};
