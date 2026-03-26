const express = require('express');
const router = express.Router();
const adjustmentController = require('../controllers/adjustmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, adjustmentController.getAdjustments);
router.get('/:id', authenticateToken, adjustmentController.getAdjustmentById);
router.post('/', authenticateToken, adjustmentController.createAdjustment);
router.delete('/:id', authenticateToken, adjustmentController.deleteAdjustment);

module.exports = router;
