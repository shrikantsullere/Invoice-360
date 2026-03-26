const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { customerUpload } = require('../utils/cloudinaryConfig');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Customer Routes
router.post('/', customerUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'anyFile', maxCount: 1 }
]), customerController.createCustomer);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

router.put('/:id', customerUpload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'anyFile', maxCount: 1 }
]), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/:id/statement', customerController.getCustomerStatement);

module.exports = router;
