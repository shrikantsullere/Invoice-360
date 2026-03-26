require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const planRoutes = require('./src/routes/planRoutes');
const planRequestRoutes = require('./src/routes/planRequestRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const chartOfAccountsRoutes = require('./src/routes/chartOfAccountsRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const bankTransferRoutes = require('./src/routes/bankTransferRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const incomeRoutes = require('./src/routes/incomeRoutes');
const contraRoutes = require('./src/routes/contraRoutes');
// Warehouse Routes
const warehouseRoutes = require('./src/routes/warehouseRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const uomRoutes = require('./src/routes/uomRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const stockTransferRoutes = require('./src/routes/stockTransferRoutes');
const adjustmentRoutes = require('./src/routes/adjustmentRoutes');
const salesQuotationRoutes = require('./src/routes/salesQuotationRoutes');
const salesOrderRoutes = require('./src/routes/salesOrderRoutes');
const deliveryChallanRoutes = require('./src/routes/deliveryChallanRoutes');
const salesInvoiceRoutes = require('./src/routes/salesInvoiceRoutes');
const salesStatementRoutes = require('./src/routes/salesStatementRoutes');
const salesReceiptRoutes = require('./src/routes/salesReceiptRoutes');
const salesReturnRoutes = require('./src/routes/salesReturnRoutes');
const posRoutes = require('./src/routes/posRoutes');
const passwordRequestRoutes = require('./src/routes/passwordRequestRoutes');
// Purchase Routes
const purchaseQuotationRoutes = require('./src/routes/purchaseQuotationRoutes');
const purchaseOrderRoutes = require('./src/routes/purchaseOrderRoutes');
const goodsReceiptNoteRoutes = require('./src/routes/goodsReceiptNoteRoutes');
const purchaseReturnRoutes = require('./src/routes/purchaseReturnRoutes');
const purchaseBillRoutes = require('./src/routes/purchaseBillRoutes');
const voucherRoutes = require('./src/routes/voucherRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Force Restart
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/plan-requests', planRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/superadmin/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bank-transfers', bankTransferRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/contra', contraRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/uom', uomRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stock-transfers', stockTransferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/sales-quotations', salesQuotationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/delivery-challans', deliveryChallanRoutes);
app.use('/api/sales-invoices', salesInvoiceRoutes);
app.use('/api/sales-statements', salesStatementRoutes);
app.use('/api/sales-receipts', salesReceiptRoutes);
app.use('/api/sales-returns', salesReturnRoutes);
app.use('/api/pos-invoices', posRoutes);
app.use('/api/password-requests', passwordRequestRoutes);
app.use('/api/purchase-quotations', purchaseQuotationRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grns', goodsReceiptNoteRoutes);
app.use('/api/purchase-returns', purchaseReturnRoutes);
app.use('/api/purchase-bills', purchaseBillRoutes);
app.use('/api/purchase-payments', paymentRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Accounting Software Backend is running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('--- ERROR START ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    if (err.data) console.error('Cloudinary Data:', err.data);
    console.error('--- ERROR END ---');

    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {},
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
