const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// Employee Management
router.post('/employees', payrollController.createEmployee);
router.get('/employees', payrollController.getAllEmployees);
router.put('/employees/:id', payrollController.updateEmployee);
router.delete('/employees/:id', payrollController.deleteEmployee);

// Salary Structure
router.post('/structures', payrollController.createSalaryStructure);
router.get('/structures', payrollController.getAllStructures);
router.put('/structures/:id', payrollController.updateSalaryStructure);
router.post('/structures/:id/components', payrollController.addComponentToStructure);
router.post('/structures/assign', payrollController.assignStructure);

// Payroll
router.post('/generate', payrollController.generatePayroll);
router.get('/history', payrollController.getPayrollHistory);
router.put('/status/:id', payrollController.updatePayrollStatus);

// Settings
router.get('/settings', payrollController.getPayrollSettings);
router.put('/settings', payrollController.updatePayrollSettings);

module.exports = router;
