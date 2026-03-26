const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Sales Invoice
const createInvoice = async (req, res) => {
    try {
        const { invoiceNumber, date, dueDate, customerId, salesOrderId, deliveryChallanId, items, notes, taxAmount } = req.body;
        // Fallback to req.body.companyId if req.user is missing (custom frontend case)
        const companyId = req.user?.companyId || req.body.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID is missing' });
        }

        if (!invoiceNumber || !customerId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // 1. Get Customer and its Ledger
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(customerId) },
            include: { ledger: true }
        });

        if (!customer || !customer.ledgerId) {
            return res.status(400).json({ success: false, message: 'Customer ledger not found' });
        }

        // 2. Find Sales Income Ledger
        // 2. Find Sales Income Ledger
        let salesLedger = await prisma.ledger.findFirst({
            where: { companyId: parseInt(companyId), name: { contains: 'Sales' }, accountgroup: { type: 'INCOME' } }
        });

        // 2b. If not found, try to auto-create it
        if (!salesLedger) {
            // Find an Income group
            let incomeGroup = await prisma.accountgroup.findFirst({
                where: { companyId: parseInt(companyId), type: 'INCOME' }
            });

            if (!incomeGroup) {
                // Create Direct Income group if no income group exists
                incomeGroup = await prisma.accountgroup.create({
                    data: {
                        name: 'Direct Income',
                        type: 'INCOME',
                        companyId: parseInt(companyId)
                    }
                });
            }

            // Create the Sales Income ledger
            salesLedger = await prisma.ledger.create({
                data: {
                    name: 'Sales Income',
                    groupId: incomeGroup.id,
                    companyId: parseInt(companyId),
                    description: 'Auto-created Sales Income Ledger',
                    openingBalance: 0,
                    currentBalance: 0
                }
            });
        }

        let subtotal = 0;
        let totalDiscount = 0;
        let lineTaxSum = 0;

        const invoiceItems = items.map(item => {
            const itemQty = parseFloat(item.quantity) || 0;
            const itemRate = parseFloat(item.rate) || 0;
            const itemDiscount = parseFloat(item.discount) || 0;
            const itemTaxRate = parseFloat(item.taxRate) || 0;

            const lineGross = itemQty * itemRate;
            const lineTaxable = lineGross - itemDiscount;
            const lineTax = (lineTaxable * itemTaxRate) / 100;
            const lineTotal = lineTaxable + lineTax;

            subtotal += lineGross;
            totalDiscount += itemDiscount;
            lineTaxSum += lineTax;

            return {
                productId: item.productId ? parseInt(item.productId) : null,
                serviceId: item.serviceId ? parseInt(item.serviceId) : null,
                description: item.description || 'Sales Item',
                quantity: itemQty,
                rate: itemRate,
                discount: itemDiscount,
                amount: lineTotal,
                taxRate: itemTaxRate,
                warehouseId: item.warehouseId ? parseInt(item.warehouseId) : null
            };
        });

        const finalTax = parseFloat(taxAmount) || lineTaxSum;
        const totalAmount = (subtotal - totalDiscount) + finalTax;

        const result = await prisma.$transaction(async (tx) => {
            // A. Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    date: new Date(date),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    customerId: parseInt(customerId),
                    companyId: parseInt(companyId),
                    salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
                    deliveryChallanId: deliveryChallanId ? parseInt(deliveryChallanId) : null,
                    subtotal,
                    discountAmount: totalDiscount,
                    taxAmount: finalTax,
                    totalAmount,
                    balanceAmount: totalAmount,
                    notes,
                    invoiceitem: {
                        create: invoiceItems.map(i => ({
                            productId: i.productId,
                            serviceId: i.serviceId,
                            description: i.description,
                            quantity: i.quantity,
                            rate: i.rate,
                            discount: i.discount,
                            amount: i.amount,
                            taxRate: i.taxRate,
                            warehouseId: i.warehouseId
                        }))
                    }
                }
            });

            // B. Inventory OUT Logic
            const company = await tx.company.findUnique({ where: { id: parseInt(companyId) } });
            const config = company.inventoryConfig || {};

            if (deliveryChallanId) {
                // Invoiced from Challan
                const challan = await tx.deliverychallan.findUnique({
                    where: { id: parseInt(deliveryChallanId) },
                    include: { deliverychallanitem: true }
                });

                if (challan) {
                    await tx.deliverychallan.update({
                        where: { id: challan.id },
                        data: { status: 'DELIVERED' } // Marks as completed
                    });

                    // If Challan only RESERVED, we must ISSUE now
                    if (config.challanAction === 'RESERVE') {
                        for (const item of invoiceItems) {
                            if (item.productId && item.warehouseId) {
                                // 1. Clear Challan Reservation
                                await tx.stock.updateMany({
                                    where: { productId: item.productId, warehouseId: item.warehouseId },
                                    data: {
                                        reservedQuantity: { decrement: item.quantity },
                                        quantity: { decrement: item.quantity }
                                    }
                                });

                                // 2. Log Transaction
                                await tx.inventorytransaction.create({
                                    data: {
                                        type: 'SALE',
                                        productId: item.productId,
                                        fromWarehouseId: item.warehouseId,
                                        quantity: item.quantity,
                                        reason: `Invoice from Reserved Challan: ${invoiceNumber}`,
                                        companyId: parseInt(companyId)
                                    }
                                });
                            }
                        }
                    }
                }
            } else if (salesOrderId) {
                // Invoiced from SO (Directly)
                const so = await tx.salesorder.findUnique({
                    where: { id: parseInt(salesOrderId) },
                    include: { salesorderitem: true }
                });

                if (so) {
                    await tx.salesorder.update({
                        where: { id: so.id },
                        data: { status: 'COMPLETED' }
                    });

                    for (const item of invoiceItems) {
                        if (item.productId && item.warehouseId) {
                            // 1. Clear SO Reservation if it was active
                            if (config.reserveOnSO) {
                                await tx.stock.updateMany({
                                    where: { productId: item.productId, warehouseId: item.warehouseId },
                                    data: { reservedQuantity: { decrement: item.quantity } }
                                });
                            }

                            // 2. Decrement Stock
                            await tx.stock.updateMany({
                                where: { productId: item.productId, warehouseId: item.warehouseId },
                                data: { quantity: { decrement: item.quantity } }
                            });

                            // 3. Log Transaction
                            await tx.inventorytransaction.create({
                                data: {
                                    type: 'SALE',
                                    productId: item.productId,
                                    fromWarehouseId: item.warehouseId,
                                    quantity: item.quantity,
                                    reason: `Invoice from SO: ${invoiceNumber}`,
                                    companyId: parseInt(companyId)
                                }
                            });
                        }
                    }
                }
            } else {
                // Direct Invoice
                for (const item of invoiceItems) {
                    if (item.productId && item.warehouseId) {
                        await tx.stock.updateMany({
                            where: { productId: item.productId, warehouseId: item.warehouseId },
                            data: { quantity: { decrement: item.quantity } }
                        });

                        await tx.inventorytransaction.create({
                            data: {
                                type: 'SALE',
                                productId: item.productId,
                                fromWarehouseId: item.warehouseId,
                                companyId: parseInt(companyId),
                                quantity: item.quantity,
                                reason: `Direct Invoice: ${invoiceNumber}`
                            }
                        });
                    }
                }
            }

            // C. Accounting Entry (Double Entry)
            // DR Customer, CR Sales Income

            // 1. Journal Entry Header
            const journal = await tx.journalentry.create({
                data: {
                    voucherNumber: invoiceNumber,
                    date: new Date(date),
                    narration: `Sales Invoice: ${invoiceNumber}`,
                    companyId: parseInt(companyId)
                }
            });

            // 2. DR Customer
            await tx.transaction.create({
                data: {
                    date: new Date(date),
                    voucherType: 'SALES',
                    voucherNumber: invoiceNumber,
                    debitLedgerId: customer.ledgerId,
                    creditLedgerId: salesLedger.id,
                    amount: totalAmount,
                    narration: `Sales to ${customer.name}`,
                    companyId: parseInt(companyId),
                    journalEntryId: journal.id,
                    invoiceId: invoice.id
                }
            });

            // Update Customer Ledger Balance (Debits increase Asset)
            await tx.ledger.update({
                where: { id: customer.ledgerId },
                data: { currentBalance: { increment: totalAmount } }
            });

            // Update Sales Ledger Balance (Credits increase Income)
            await tx.ledger.update({
                where: { id: salesLedger.id },
                data: { currentBalance: { increment: subtotal } }
            });

            // Handle Tax Ledger if applicable
            if (finalTax > 0) {
                const taxLedger = await tx.ledger.findFirst({
                    where: { companyId: parseInt(companyId), name: { contains: 'Tax' }, accountgroup: { type: 'LIABILITIES' } }
                });
                if (taxLedger) {
                    await tx.ledger.update({
                        where: { id: taxLedger.id },
                        data: { currentBalance: { increment: finalTax } }
                    });
                }
            }

            // Update Sales Order status if fully invoiced
            if (salesOrderId) {
                await tx.salesorder.update({
                    where: { id: parseInt(salesOrderId) },
                    data: { status: 'COMPLETED' }
                });
            }

            return invoice;
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Invoice Creation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Invoices
const getInvoices = async (req, res) => {
    try {
        const companyId = req.user?.companyId || req.query.companyId;
        if (!companyId) return res.status(400).json({ success: false, message: 'Company ID Missing' });

        const invoices = await prisma.invoice.findMany({
            where: { companyId: parseInt(companyId) },
            include: {
                customer: { select: { name: true, email: true, ledgerId: true } },
                invoiceitem: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Invoice By ID
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;
        // Note: req.query.companyId might not be passed for getById standardly, but consistent with getAll

        if (!companyId) return res.status(400).json({ success: false, message: 'Company ID Missing' });

        const invoice = await prisma.invoice.findFirst({
            where: { id: parseInt(id), companyId: parseInt(companyId) },
            include: {
                invoiceitem: {
                    include: {
                        product: true,
                        service: true,
                        warehouse: true
                    }
                },
                customer: true,
                salesorder: true,
                receipt: true
            }
        });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Invoice
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, ...data } = req.body;

        // This is a simplified update that updates basic fields.
        // Full update with inventory/ledger reversal handling requires more complex logic.
        const invoice = await prisma.invoice.update({
            where: { id: parseInt(id) },
            data: {
                notes: data.notes,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                // Add more fields as needed
            }
        });
        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Invoice
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.invoice.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Next Invoice Number
const getNextNumber = async (req, res) => {
    try {
        const companyId = req.user?.companyId || req.query.companyId;
        if (!companyId) return res.status(400).json({ success: false, message: 'Company ID Missing' });

        const lastInvoice = await prisma.invoice.findFirst({
            where: { companyId: parseInt(companyId) },
            orderBy: { id: 'desc' }
        });

        let nextNumber = '101'; // Default start
        if (lastInvoice && lastInvoice.invoiceNumber) {
            // Try to extract number
            const lastNumStr = lastInvoice.invoiceNumber.replace(/\D/g, '');
            if (lastNumStr) {
                const lastNum = parseInt(lastNumStr);
                nextNumber = (lastNum + 1).toString();
            }
        }

        res.status(200).json({ success: true, nextNumber });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    getNextNumber
};