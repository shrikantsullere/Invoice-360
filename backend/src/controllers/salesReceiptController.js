const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create Customer Receipt (Payment)
const createReceipt = async (req, res) => {
    try {
        const { receiptNumber, date, customerId, invoiceId, amount, paymentMode, referenceNumber, cashBankAccountId, notes } = req.body;
        const companyId = req.user.companyId;

        if (!receiptNumber || !customerId || !amount || !cashBankAccountId) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Normalize payment mode for Prisma enum
        const modeMap = {
            'Bank Transfer': 'BANK',
            'Online': 'BANK',
            'UPI': 'UPI',
            'Cash': 'CASH',
            'Credit Card': 'CARD',
            'Cheque': 'CHEQUE'
        };
        const normalizedMode = modeMap[paymentMode] || 'OTHER';

        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(customerId) },
            include: { ledger: true }
        });

        const bankLedger = await prisma.ledger.findUnique({
            where: { id: parseInt(cashBankAccountId) }
        });

        if (!customer || !customer.ledgerId || !bankLedger) {
            return res.status(400).json({ success: false, message: 'Invalid customer or bank/cash account' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Receipt Record
            const receipt = await tx.receipt.create({
                data: {
                    receiptNumber,
                    date: new Date(date),
                    customerId: parseInt(customerId),
                    invoiceId: invoiceId ? parseInt(invoiceId) : null,
                    amount: parseFloat(amount),
                    paymentMode: normalizedMode,
                    referenceNumber,
                    companyId: parseInt(companyId),
                    notes
                }
            });

            // 2. Update Invoice Balance if applicable
            if (invoiceId) {
                const invoice = await tx.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
                const newPaid = invoice.paidAmount + parseFloat(amount);
                const newBalance = invoice.totalAmount - newPaid;

                await tx.invoice.update({
                    where: { id: parseInt(invoiceId) },
                    data: {
                        paidAmount: newPaid,
                        balanceAmount: newBalance,
                        status: newBalance <= 0 ? 'PAID' : 'PARTIAL'
                    }
                });
            }

            // 3. Accounting Entries
            // DR Cash/Bank, CR Customer

            // Ledger Postings
            await tx.ledger.update({
                where: { id: bankLedger.id },
                data: { currentBalance: { increment: parseFloat(amount) } }
            });

            await tx.ledger.update({
                where: { id: customer.ledgerId },
                data: { currentBalance: { decrement: parseFloat(amount) } }
            });

            // Log Transaction
            await tx.transaction.create({
                data: {
                    date: new Date(date),
                    voucherType: 'RECEIPT',
                    voucherNumber: receiptNumber,
                    debitLedgerId: bankLedger.id,
                    creditLedgerId: customer.ledgerId,
                    amount: parseFloat(amount),
                    narration: `Payment received from ${customer.name}${invoiceId ? ' for Invoice ' + invoiceId : ''}`,
                    companyId: parseInt(companyId),
                    receiptId: receipt.id,
                    invoiceId: invoiceId ? parseInt(invoiceId) : null
                }
            });

            return receipt;
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Receipt Creation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Receipts
const getReceipts = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const receipts = await prisma.receipt.findMany({
            where: { companyId: parseInt(companyId) },
            include: {
                customer: { select: { name: true } },
                invoice: { select: { invoiceNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: receipts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Receipt by ID
const getReceiptById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const receipt = await prisma.receipt.findFirst({
            where: {
                id: parseInt(id),
                companyId: parseInt(companyId)
            },
            include: {
                customer: true,
                invoice: true
            }
        });

        if (!receipt) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }

        res.status(200).json({ success: true, data: receipt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createReceipt,
    getReceipts,
    getReceiptById
};
