const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPayment = async (req, res) => {
    try {
        const {
            paymentNumber,
            date,
            vendorId,
            purchaseBillId,
            amount,
            paymentMode,
            referenceNumber,
            notes
        } = req.body;
        const companyId = req.user?.companyId || req.query.companyId || req.body.companyId;

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

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    paymentNumber: paymentNumber || `PAY-${Date.now()}`,
                    date: date ? new Date(date) : new Date(),
                    vendorId: parseInt(vendorId),
                    purchaseBillId: purchaseBillId ? parseInt(purchaseBillId) : null,
                    amount: parseFloat(amount),
                    paymentMode: normalizedMode,
                    referenceNumber,
                    companyId: parseInt(companyId),
                    notes
                },
                include: {
                    vendor: true,
                    purchasebill: true,
                    company: true
                }
            });

            if (purchaseBillId) {
                const bill = await tx.purchasebill.findUnique({
                    where: { id: parseInt(purchaseBillId) }
                });

                if (bill) {
                    const newPaidAmount = (bill.paidAmount || 0) + parseFloat(amount);
                    const newBalanceAmount = bill.totalAmount - newPaidAmount;
                    const newStatus = newBalanceAmount <= 0 ? 'PAID' : 'PARTIAL';

                    await tx.purchasebill.update({
                        where: { id: parseInt(purchaseBillId) },
                        data: {
                            paidAmount: newPaidAmount,
                            balanceAmount: newBalanceAmount,
                            status: newStatus
                        }
                    });
                }
            }
            return payment;
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const {
            companyId,
            vendorId,
            startDate,
            endDate
        } = req.query;

        const currentCompanyId = req.user?.companyId || companyId;

        let where = {};
        if (currentCompanyId) where.companyId = parseInt(currentCompanyId);
        if (vendorId) where.vendorId = parseInt(vendorId);
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                vendor: true,
                purchasebill: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        res.json(payments);
    } catch (error) {
        console.error('Get Payments Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const companyId = req.user?.companyId || req.query.companyId;
        const payment = await prisma.payment.findFirst({
            where: { id: parseInt(req.params.id), companyId: parseInt(companyId) },
            include: {
                vendor: true,
                purchasebill: true,
                company: true
            }
        });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        console.error('Get Payment By ID Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updatePayment = async (req, res) => {
    try {
        const {
            paymentNumber,
            date,
            vendorId,
            purchaseBillId,
            amount,
            paymentMode,
            referenceNumber,
            notes
        } = req.body;
        const currentCompanyId = req.user?.companyId || req.query.companyId || req.body.companyId;

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

        const payment = await prisma.payment.update({
            where: { id: parseInt(req.params.id), companyId: parseInt(currentCompanyId) },
            data: {
                paymentNumber,
                date: date ? new Date(date) : undefined,
                vendorId: vendorId ? parseInt(vendorId) : undefined,
                purchaseBillId: purchaseBillId ? parseInt(purchaseBillId) : undefined,
                amount: amount ? parseFloat(amount) : undefined,
                paymentMode: normalizedMode,
                referenceNumber,
                companyId: currentCompanyId ? parseInt(currentCompanyId) : undefined,
                notes
            },
            include: {
                vendor: true,
                purchasebill: true
            }
        });
        res.json(payment);
    } catch (error) {
        console.error('Update Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;

        const payment = await prisma.payment.findFirst({
            where: { id: parseInt(id), companyId: parseInt(companyId) }
        });

        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        await prisma.$transaction(async (tx) => {
            if (payment.purchaseBillId) {
                const bill = await tx.purchasebill.findUnique({
                    where: { id: payment.purchaseBillId }
                });

                if (bill) {
                    const newPaidAmount = Math.max(0, (bill.paidAmount || 0) - payment.amount);
                    const newBalanceAmount = bill.totalAmount - newPaidAmount;
                    const newStatus = newBalanceAmount >= bill.totalAmount ? 'UNPAID' : (newBalanceAmount > 0 ? 'PARTIAL' : 'PAID');

                    await tx.purchasebill.update({
                        where: { id: payment.purchaseBillId },
                        data: {
                            paidAmount: newPaidAmount,
                            balanceAmount: newBalanceAmount,
                            status: newStatus
                        }
                    });
                }
            }

            await tx.payment.delete({
                where: { id: parseInt(id), companyId: parseInt(companyId) }
            });
        });

        res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Delete Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment
};
