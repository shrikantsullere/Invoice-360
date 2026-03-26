const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/stockTransferController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, stockTransferController.getStockTransfers);
router.get('/:id', authenticateToken, stockTransferController.getStockTransferById);
router.post('/', authenticateToken, stockTransferController.createStockTransfer);
router.delete('/:id', authenticateToken, stockTransferController.deleteStockTransfer);

module.exports = router;
