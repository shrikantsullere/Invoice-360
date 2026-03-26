const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAdjustments = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const adjustments = await prisma.inventoryadjustment.findMany({
            where: { companyId: parseInt(companyId) },
            include: {
                warehouse: true,
                inventoryadjustmentitem: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: adjustments });
    } catch (error) {
        console.error('Error fetching adjustments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdjustmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const adjustment = await prisma.inventoryadjustment.findFirst({
            where: {
                id: parseInt(id),
                companyId: parseInt(companyId)
            },
            include: {
                warehouse: true,
                inventoryadjustmentitem: {
                    include: {
                        product: true
                    }
                }
            }
        });
        if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });
        res.status(200).json({ success: true, data: adjustment });
    } catch (error) {
        console.error('Error fetching adjustment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createAdjustment = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const {
            voucherNo,
            manualVoucherNo,
            date,
            type, // ADD_STOCK, REMOVE_STOCK, ADJUST_VALUE
            warehouseId,
            note,
            totalValue,
            items
        } = req.body;

        if (!voucherNo || !type || !warehouseId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create adjustment record
            const adjustment = await tx.inventoryadjustment.create({
                data: {
                    voucherNo,
                    manualVoucherNo,
                    date: date ? new Date(date) : new Date(),
                    type,
                    warehouseId: parseInt(warehouseId),
                    note,
                    totalValue: parseFloat(totalValue || 0),
                    companyId: parseInt(companyId),
                    inventoryadjustmentitem: {
                        create: items.map(item => ({
                            productId: parseInt(item.productId),
                            warehouseId: parseInt(warehouseId), // Uses the main warehouse for adjustment
                            quantity: parseFloat(item.quantity || 0),
                            rate: parseFloat(item.rate || 0),
                            amount: parseFloat(item.amount || 0),
                            narration: item.narration
                        }))
                    }
                },
                include: { inventoryadjustmentitem: true }
            });

            // 2. Update Stock and Log Transactions
            for (const item of items) {
                const qty = parseFloat(item.quantity || 0);
                const productId = parseInt(item.productId);
                const whId = parseInt(warehouseId);

                if (type === 'ADD_STOCK') {
                    // Increment Stock
                    await tx.stock.upsert({
                        where: {
                            warehouseId_productId: {
                                warehouseId: whId,
                                productId: productId
                            }
                        },
                        update: { quantity: { increment: qty } },
                        create: {
                            warehouseId: whId,
                            productId: productId,
                            quantity: qty
                        }
                    });

                    // Log Transaction
                    await tx.inventorytransaction.create({
                        data: {
                            productId: productId,
                            toWarehouseId: whId,
                            quantity: qty,
                            type: 'ADJUSTMENT',
                            reason: `Adjustment (Add): ${voucherNo}. ${item.narration || ''}`,
                            companyId: parseInt(companyId)
                        }
                    });
                } else if (type === 'REMOVE_STOCK') {
                    // Check availability
                    const currentStock = await tx.stock.findUnique({
                        where: {
                            warehouseId_productId: {
                                warehouseId: whId,
                                productId: productId
                            }
                        }
                    });

                    if (!currentStock || currentStock.quantity < qty) {
                        throw new Error(`Insufficient stock for product ID ${productId} in selected warehouse`);
                    }

                    // Decrement Stock
                    await tx.stock.update({
                        where: {
                            warehouseId_productId: {
                                warehouseId: whId,
                                productId: productId
                            }
                        },
                        data: { quantity: { decrement: qty } }
                    });

                    // Log Transaction
                    await tx.inventorytransaction.create({
                        data: {
                            productId: productId,
                            fromWarehouseId: whId,
                            quantity: qty,
                            type: 'ADJUSTMENT',
                            reason: `Adjustment (Remove): ${voucherNo}. ${item.narration || ''}`,
                            companyId: parseInt(companyId)
                        }
                    });
                } else if (type === 'ADJUST_VALUE') {
                    // Only log transaction or update value if we had a value field in Stock
                    // For now, just log the transaction as a reason
                    await tx.inventorytransaction.create({
                        data: {
                            productId: productId,
                            toWarehouseId: whId,
                            quantity: 0,
                            type: 'ADJUSTMENT',
                            reason: `Value Adjustment: ${voucherNo}. ${item.narration || ''}`,
                            companyId: parseInt(companyId)
                        }
                    });
                }
            }

            // 3. Accounting Integration (GL Posting)
            // Find relevant ledgers
            const inventoryAsset = await tx.ledger.findFirst({
                where: { companyId: parseInt(companyId), name: 'Inventory Asset' }
            });
            const adjExpense = await tx.ledger.findFirst({
                where: { companyId: parseInt(companyId), name: 'Inventory Adjustment Expense' }
            });
            const salesIncome = await tx.ledger.findFirst({
                where: { companyId: parseInt(companyId), name: 'Sales Income' }
            }); // Fallback for Add Stock if no specific gain account

            if (inventoryAsset) {
                let debitLedgerId, creditLedgerId;
                const totalAmt = parseFloat(totalValue || 0);

                if (type === 'ADD_STOCK' && salesIncome) {
                    debitLedgerId = inventoryAsset.id;
                    creditLedgerId = salesIncome.id;
                } else if (type === 'REMOVE_STOCK' && adjExpense) {
                    debitLedgerId = adjExpense.id;
                    creditLedgerId = inventoryAsset.id;
                }

                if (debitLedgerId && creditLedgerId && totalAmt > 0) {
                    await tx.transaction.create({
                        data: {
                            date: date ? new Date(date) : new Date(),
                            debitLedgerId,
                            creditLedgerId,
                            amount: totalAmt,
                            narration: `Inventory Adjustment (${type}): ${voucherNo}. ${note || ''}`,
                            voucherType: 'JOURNAL',
                            voucherNumber: voucherNo,
                            companyId: parseInt(companyId)
                        }
                    });

                    // Update Ledger Balances
                    await tx.ledger.update({
                        where: { id: debitLedgerId },
                        data: { currentBalance: { increment: totalAmt } }
                    });
                    await tx.ledger.update({
                        where: { id: creditLedgerId },
                        data: { currentBalance: { decrement: totalAmt } }
                    });
                }
            }

            return adjustment;
        });

        res.status(201).json({ success: true, message: 'Adjustment saved successfully', data: result });
    } catch (error) {
        console.error('Error creating adjustment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAdjustment = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const adjustment = await prisma.inventoryadjustment.findFirst({
            where: {
                id: parseInt(id),
                companyId: parseInt(companyId)
            },
            include: { inventoryadjustmentitem: true }
        });

        if (!adjustment) return res.status(404).json({ success: false, message: 'Adjustment not found' });

        await prisma.$transaction(async (tx) => {
            // Reverse Stock Changes
            for (const item of adjustment.inventoryadjustmentitem) {
                const qty = item.quantity;
                const productId = item.productId;
                const whId = adjustment.warehouseId;

                if (adjustment.type === 'ADD_STOCK') {
                    // Decrement what we added
                    await tx.stock.update({
                        where: {
                            warehouseId_productId: {
                                warehouseId: whId,
                                productId: productId
                            }
                        },
                        data: { quantity: { decrement: qty } }
                    });
                } else if (adjustment.type === 'REMOVE_STOCK') {
                    // Increment what we removed
                    await tx.stock.update({
                        where: {
                            warehouseId_productId: {
                                warehouseId: whId,
                                productId: productId
                            }
                        },
                        data: { quantity: { increment: qty } }
                    });
                }
            }

            // Reverse Accounting Integration (GL Posting)
            const transactions = await tx.transaction.findMany({
                where: {
                    companyId: parseInt(adjustment.companyId),
                    voucherNumber: adjustment.voucherNo,
                    voucherType: 'JOURNAL'
                }
            });

            for (const trans of transactions) {
                // Reverse Ledger Balances
                await tx.ledger.update({
                    where: { id: trans.debitLedgerId },
                    data: { currentBalance: { decrement: trans.amount } }
                });
                await tx.ledger.update({
                    where: { id: trans.creditLedgerId },
                    data: { currentBalance: { increment: trans.amount } }
                });

                // Delete the transaction
                await tx.transaction.delete({
                    where: { id: trans.id }
                });
            }

            // Delete Adjustment (cascades to items)
            await tx.inventoryadjustment.delete({
                where: { id: parseInt(id) }
            });
        });

        res.status(200).json({ success: true, message: 'Adjustment deleted and stock reversed' });
    } catch (error) {
        console.error('Error deleting adjustment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAdjustments,
    getAdjustmentById,
    createAdjustment,
    deleteAdjustment
};
