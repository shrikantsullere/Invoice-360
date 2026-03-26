const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get All Stock Transfers
const getStockTransfers = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const transfers = await prisma.stocktransfer.findMany({
            where: { companyId: parseInt(companyId) },
            include: {
                warehouse: { select: { name: true } },
                stocktransferitem: {
                    include: {
                        product: { select: { name: true, sku: true } },
                        warehouse: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: transfers });
    } catch (error) {
        console.error('Error fetching stock transfers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get Stock Transfer By ID
const getStockTransferById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        const transfer = await prisma.stocktransfer.findFirst({
            where: {
                id: parseInt(id),
                companyId: parseInt(companyId)
            },
            include: {
                warehouse: { select: { name: true } },
                stocktransferitem: {
                    include: {
                        product: { select: { name: true, sku: true, barcode: true } },
                        warehouse: { select: { name: true } }
                    }
                }
            }
        });

        if (!transfer) {
            return res.status(404).json({ success: false, message: 'Stock transfer not found' });
        }

        res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        console.error('Error fetching stock transfer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Create Stock Transfer
const createStockTransfer = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const {
            voucherNo, manualVoucherNo, date, toWarehouseId, narration, items
        } = req.body;

        if (!voucherNo || !toWarehouseId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid stock transfer data' });
        }

        // Calculate total amount
        const totalAmount = items.reduce((acc, item) => acc + (parseFloat(item.rate || 0) * parseFloat(item.quantity)), 0);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Stock Transfer Record
            const transfer = await tx.stocktransfer.create({
                data: {
                    voucherNo,
                    manualVoucherNo,
                    date: date ? new Date(date) : new Date(),
                    toWarehouseId: parseInt(toWarehouseId),
                    narration,
                    totalAmount,
                    companyId: parseInt(companyId),
                    stocktransferitem: {
                        create: items.map(item => ({
                            productId: parseInt(item.productId),
                            fromWarehouseId: parseInt(item.fromWarehouseId),
                            quantity: parseFloat(item.quantity),
                            rate: parseFloat(item.rate || 0),
                            amount: parseFloat(item.rate || 0) * parseFloat(item.quantity),
                            narration: item.narration
                        }))
                    }
                }
            });

            // 2. Update Stock and Log Inventory Transactions
            for (const item of items) {
                const qty = parseFloat(item.quantity);
                const pid = parseInt(item.productId);
                const fromWH = parseInt(item.fromWarehouseId);
                const toWH = parseInt(toWarehouseId);

                // a. Check source stock
                const sourceStock = await tx.stock.findUnique({
                    where: { warehouseId_productId: { warehouseId: fromWH, productId: pid } }
                });

                if (!sourceStock || sourceStock.quantity < qty) {
                    throw new Error(`Insufficient stock for product ID ${pid} in warehouse ID ${fromWH}`);
                }

                // b. Decrement from source
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: fromWH, productId: pid } },
                    data: { quantity: { decrement: qty } }
                });

                // c. Increment at destination
                await tx.stock.upsert({
                    where: { warehouseId_productId: { warehouseId: toWH, productId: pid } },
                    update: { quantity: { increment: qty } },
                    create: {
                        warehouseId: toWH,
                        productId: pid,
                        quantity: qty,
                        initialQty: 0,
                        minOrderQty: 0
                    }
                });

                // d. Log Inventory Transaction (History)
                await tx.inventorytransaction.create({
                    data: {
                        type: 'TRANSFER',
                        productId: pid,
                        fromWarehouseId: fromWH,
                        toWarehouseId: toWH,
                        quantity: qty,
                        reason: `Voucher: ${voucherNo}. ${item.narration || ''}`,
                        companyId: parseInt(companyId)
                    }
                });
            }

            return transfer;
        });

        res.status(201).json({ success: true, message: 'Stock transfer created successfully', data: result });
    } catch (error) {
        console.error('Error creating stock transfer:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to create stock transfer' });
    }
};

// Delete Stock Transfer (Optional: Reverse the stock if needed, but usually just soft delete or hard delete with warning)
// For this simple version, let's just delete the record. Reversing is safer in ERP.
const deleteStockTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId || req.query.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: 'Company ID is required' });
        }

        // Before deleting, we might want to reverse the stock changes
        // But for standard implementations, we often don't allow deletion of processed vouchers
        // Let's implement a hard delete but with stock reversal logic for completeness

        await prisma.$transaction(async (tx) => {
            const transfer = await tx.stocktransfer.findFirst({
                where: {
                    id: parseInt(id),
                    companyId: parseInt(companyId)
                },
                include: { stocktransferitem: true }
            });

            if (!transfer) throw new Error('Transfer not found');

            // Reverse stock for each item
            for (const item of transfer.stocktransferitem) {
                // Return to source
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: item.fromWarehouseId, productId: item.productId } },
                    data: { quantity: { increment: item.quantity } }
                });

                // Remove from destination
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: transfer.toWarehouseId, productId: item.productId } },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            // Delete inventory transactions linked to this voucher (by matching narration/reason usually, or we'd need a direct link)
            // Since we don't have a direct link in InventoryTransaction model yet, we can either add it or rely on business logic.
            // Let's just delete the transfer record and its items (cascade handles items)
            await tx.stocktransfer.delete({ where: { id: parseInt(id) } });
        });

        res.status(200).json({ success: true, message: 'Stock transfer deleted and stock reversed successfully' });
    } catch (error) {
        console.error('Error deleting stock transfer:', error);
        res.status(400).json({ success: false, message: error.message || 'Failed to delete stock transfer' });
    }
};

module.exports = {
    getStockTransfers,
    getStockTransferById,
    createStockTransfer,
    deleteStockTransfer
};
