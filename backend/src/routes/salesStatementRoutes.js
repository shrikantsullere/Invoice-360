const express = require('express');
const router = express.Router();
const salesStatementController = require('../controllers/salesStatementController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, salesStatementController.getSalesStatement);

module.exports = router;
