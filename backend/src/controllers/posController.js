const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create POS Invoice
const createPOSInvoice = async (req, res) => {
    try {
        const {
            companyId,
            customerId, // Optional (for walk-in)
            items,
            paymentMode, // CASH, CARD, UPI, MIXED (If mixed, handle multiple payments - simplified here to single mode or use payments array)
            discountAmount,
            notes,
            receivedAmount // For calculating change?
        } = req.body;

        const currentCompanyId = req.user?.companyId || companyId;

        if (!currentCompanyId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid data provided' });
        }

        // 1. Calculate Totals
        let subtotal = 0;
        let totalTax = 0;
        const processedItems = items.map(item => {
            const qty = parseFloat(item.quantity);
            const rate = parseFloat(item.rate);
            const disc = parseFloat(item.discount || 0);
            const tax = parseFloat(item.taxRate || 0);

            const gross = qty * rate;
            const taxable = gross - disc;
            const taxAmt = (taxable * tax) / 100;
            const total = taxable + taxAmt;

            subtotal += gross;
            totalTax += taxAmt;

            return {
                ...item,
                qty, rate, disc, tax, taxAmt, total, taxable
            };
        });

        const invoiceTotal = parseFloat((subtotal - (parseFloat(discountAmount) || 0) + totalTax).toFixed(2));
        const finalDiscount = parseFloat(discountAmount) || 0;

        // 2. Start Transaction
        const result = await prisma.$transaction(async (tx) => {

            // A. Generate Invoice Number
            const count = await tx.posinvoice.count({ where: { companyId: parseInt(currentCompanyId) } });
            const invoiceNumber = `POS-${String(count + 1).padStart(6, '0')}`;

            // B. Find/Create Ledgers

            // Sales Ledger (Income)
            let salesLedger = await tx.ledger.findFirst({
                where: { companyId: parseInt(currentCompanyId), name: { contains: 'Sales' }, accountgroup: { type: 'INCOME' } }
            });
            if (!salesLedger) {
                // Auto-create simplified
                const refGroup = await tx.accountgroup.findFirst({ where: { companyId: parseInt(currentCompanyId), type: 'INCOME' } });
                salesLedger = await tx.ledger.create({
                    data: {
                        name: 'Sales Income (POS)',
                        groupId: refGroup ? refGroup.id : (await tx.accountgroup.create({ data: { name: 'Direct Income', type: 'INCOME', companyId: parseInt(currentCompanyId) } }).then(g => g.id)),
                        companyId: parseInt(currentCompanyId)
                    }
                });
            }

            // Customer/Cash Ledger
            let debitLedgerId = null;
            let customerLedgerId = null;

            if (customerId) {
                const customer = await tx.customer.findUnique({ where: { id: parseInt(customerId) } });
                if (customer?.ledgerId) {
                    customerLedgerId = customer.ledgerId;
                    debitLedgerId = customer.ledgerId;
                }
            }

            // If no customer (Walk-in) or customer has no ledger, use Cash/Bank directly for Sale?
            // Standard accounting: Sale always Debit Receiver (Customer). 
            // If Walk-in, we usually map to a 'Walk-in Customer' account.
            // For simplicity, if no customerId, we Debit Cash directly (Cash Sale).

            let cashBankLedger = null;
            if (!customerId) {
                // Find Cash Ledger
                cashBankLedger = await tx.ledger.findFirst({
                    where: { companyId: parseInt(currentCompanyId), name: { contains: 'Cash' }, accountgroup: { type: 'ASSETS' } }
                });
                if (!cashBankLedger) {
                    // Create Cash Ledger
                    const refGroup = await tx.accountgroup.findFirst({ where: { companyId: parseInt(currentCompanyId), type: 'ASSETS' } });
                    cashBankLedger = await tx.ledger.create({
                        data: { name: 'Cash Account', groupId: refGroup.id, companyId: parseInt(currentCompanyId) }
                    });
                }
                debitLedgerId = cashBankLedger.id;
            }

            // C. Create POS Invoice
            const posInvoice = await tx.posinvoice.create({
                data: {
                    invoiceNumber,
                    companyId: parseInt(currentCompanyId),
                    customerId: customerId ? parseInt(customerId) : null,
                    subtotal: subtotal,
                    discountAmount: finalDiscount,
                    taxAmount: totalTax,
                    totalAmount: invoiceTotal,
                    paidAmount: invoiceTotal, // Assuming POS is immediate payment usually. If credit, simple modification needed.
                    balanceAmount: 0,
                    paymentMode: paymentMode || 'CASH',
                    status: 'Paid',
                    updatedAt: new Date(),
                    notes: notes || null,
                    posinvoiceitem: {
                        create: processedItems.map(i => ({
                            productId: parseInt(i.productId),
                            warehouseId: parseInt(i.warehouseId),
                            description: i.description || 'POS Item',
                            quantity: i.qty,
                            rate: i.rate,
                            amount: parseFloat(i.total),
                            taxRate: parseFloat(i.tax), // Pass taxRate to item
                            updatedAt: new Date()
                        }))
                    }
                }
            });

            // D. Inventory Update (Decrement Stock)
            for (const item of processedItems) {
                // 1. Decrement Warehouse Stock
                const stock = await tx.stock.findUnique({
                    where: { warehouseId_productId: { warehouseId: parseInt(item.warehouseId), productId: parseInt(item.productId) } }
                });

                if (stock) {
                    await tx.stock.update({
                        where: { id: stock.id },
                        data: { quantity: { decrement: item.qty } }
                    });
                } else {
                    // Create negative stock? Or error? POS usually allows selling? default to creating with negative
                    await tx.stock.create({
                        data: {
                            warehouseId: parseInt(item.warehouseId),
                            productId: parseInt(item.productId),
                            quantity: -item.qty,
                            updatedAt: new Date()
                        }
                    });
                }

                // 2. Create Inventory Transaction
                await tx.inventorytransaction.create({
                    data: {
                        date: new Date(),
                        type: 'SALE',
                        productId: parseInt(item.productId),
                        fromWarehouseId: parseInt(item.warehouseId), // Out
                        quantity: item.qty,
                        reason: `POS Sale: ${invoiceNumber}`,
                        companyId: parseInt(currentCompanyId),
                        updatedAt: new Date()
                    }
                });
            }

            // E. Accounting Entries
            // 1. Sale Entry (Dr Customer/Cash, Cr Sales)
            await tx.transaction.create({
                data: {
                    date: new Date(),
                    voucherType: 'POS_INVOICE',
                    voucherNumber: invoiceNumber,
                    companyId: parseInt(currentCompanyId),
                    debitLedgerId: debitLedgerId, // Customer or Cash
                    creditLedgerId: salesLedger.id, // Sales
                    amount: invoiceTotal,
                    narration: `POS Sale - ${invoiceNumber}`,
                    posInvoiceId: posInvoice.id,
                    updatedAt: new Date()
                }
            });

            // Update Ledger Balances for Sale
            await tx.ledger.update({ where: { id: debitLedgerId }, data: { currentBalance: { increment: invoiceTotal } } }); // Asset/Expense Debit Increases (Customer is Asset)
            await tx.ledger.update({ where: { id: salesLedger.id }, data: { currentBalance: { increment: invoiceTotal } } }); // Income Credit Increases

            // 2. Receipt Entry (If Customer ID exists, we need to record payment from Customer to Cash)
            // If Walk-in (customerId null), we already Debited Cash directly above, so no Receipt needed.
            if (customerId) {
                // Find Payment Account (Cash/Bank)
                let receiptLedger = null;
                // Assuming 'paymentMode' decides ledger
                const modeName = paymentMode === 'CASH' ? 'Cash' : 'Bank';
                receiptLedger = await tx.ledger.findFirst({
                    where: { companyId: parseInt(currentCompanyId), name: { contains: modeName }, accountgroup: { type: 'ASSETS' } }
                });

                if (!receiptLedger) {
                    // Fallback
                    const refGroup = await tx.accountgroup.findFirst({ where: { companyId: parseInt(currentCompanyId), type: 'ASSETS' } });
                    receiptLedger = await tx.ledger.create({
                        data: { name: `${modeName} Account`, groupId: refGroup.id, companyId: parseInt(currentCompanyId), updatedAt: new Date() }
                    });
                }

                await tx.transaction.create({
                    data: {
                        date: new Date(),
                        voucherType: 'RECEIPT', // Or POS Payment?
                        voucherNumber: `RCP-${invoiceNumber}`,
                        companyId: parseInt(currentCompanyId),
                        debitLedgerId: receiptLedger.id, // Cash/Bank
                        creditLedgerId: customerLedgerId, // Customer
                        amount: invoiceTotal, // Assuming full payment
                        narration: `Payment for POS ${invoiceNumber}`,
                        posInvoiceId: posInvoice.id,
                        updatedAt: new Date()
                    }
                });

                // Update Balances for Receipt
                await tx.ledger.update({ where: { id: receiptLedger.id }, data: { currentBalance: { increment: invoiceTotal } } }); // Asset Debit Increases
                await tx.ledger.update({ where: { id: customerLedgerId }, data: { currentBalance: { decrement: invoiceTotal } } }); // Asset Credit Decreases (Customer Paid)
            }

            return posInvoice;
        });

        res.status(201).json({ success: true, data: result });

    } catch (error) {
        console.error('Create POS Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All POS
const getPOSInvoices = async (req, res) => {
    try {
        const companyId = req.user?.companyId || req.query.companyId;
        const invoices = await prisma.posinvoice.findMany({
            where: { companyId: parseInt(companyId) },
            include: {
                customer: true,
                posinvoiceitem: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single POS
const getPOSInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId || req.body.companyId;

        const invoice = await prisma.posinvoice.findUnique({
            where: { id: parseInt(id) },
            include: {
                customer: true,
                posinvoiceitem: { include: { product: true, warehouse: true } },
                transaction: true
            }
        });

        if (!invoice || invoice.companyId !== parseInt(companyId)) {
            return res.status(404).json({ success: false, message: 'POS Invoice not found' });
        }
        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete POS (Void)
const deletePOSInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId || req.body.companyId;

        // Implementation of Void/Delete
        // 1. Reverse Stock
        // 2. Reverse Ledgers? Or just delete if testing?
        // User asked for "delete".
        // Robust way: Delete Transaction entries (reverse ledger balances first), then delete Invoice.

        await prisma.$transaction(async (tx) => {
            const invoice = await tx.posinvoice.findUnique({
                where: { id: parseInt(id) },
                include: { posinvoiceitem: true, transaction: true }
            });

            if (!invoice || invoice.companyId !== parseInt(companyId)) {
                throw new Error('Invoice not found or unauthorized');
            }

            // 1. Reverse Accounting
            // Loop transactions and reverse balances
            for (const t of invoice.transaction) {
                // Reverse Debit
                await tx.ledger.update({ where: { id: t.debitLedgerId }, data: { currentBalance: { decrement: t.amount } } });
                // Reverse Credit
                await tx.ledger.update({ where: { id: t.creditLedgerId }, data: { currentBalance: { decrement: t.amount } } }); // Wait, Credit Increase = Credit. Decrementing reverses Increase?
                // Standard: Cr Income increases balance (Credit Balance).
                // Logic: 
                // If Asset (Debit Normal): Debit increases (+), Credit decreases (-).
                // If Income (Credit Normal): Credit increases (+), Debit decreases (-).

                // My logic used in create:
                // update({ currentBalance: { increment: amount } }) for Debit Ledger (usually Asset/Expense - Debit Balance) -> Correct.
                // update({ currentBalance: { increment: amount } }) for Credit Ledger (Income - Credit Balance) -> Correct.
                // So "decrement" reverses both. Correct.

                await tx.transaction.delete({ where: { id: t.id } });
            }

            // 2. Reverse Stock
            for (const item of invoice.posinvoiceitem) {
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: item.warehouseId, productId: item.productId } },
                    data: { quantity: { increment: item.quantity } }
                });

                await tx.inventorytransaction.create({
                    data: {
                        date: new Date(),
                        type: 'RETURN', // Internal Return
                        productId: item.productId,
                        toWarehouseId: item.warehouseId,
                        quantity: item.quantity,
                        reason: `Void POS: ${invoice.invoiceNumber}`,
                        companyId: parseInt(companyId || invoice.companyId)
                    }
                });
            }

            // 3. Delete Invoice
            await tx.posinvoice.delete({ where: { id: parseInt(id) } });
        });

        res.status(200).json({ success: true, message: 'POS Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPOSInvoice,
    getPOSInvoices,
    getPOSInvoiceById,
    deletePOSInvoice
};
