const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoiceController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/', authenticateToken, salesInvoiceController.createInvoice);
router.get('/', authenticateToken, salesInvoiceController.getInvoices);
router.get('/:id', authenticateToken, salesInvoiceController.getInvoiceById);
router.put('/:id', authenticateToken, salesInvoiceController.updateInvoice);
router.delete('/:id', authenticateToken, salesInvoiceController.deleteInvoice);
router.get('/next-number', authenticateToken, salesInvoiceController.getNextNumber);

module.exports = router;
