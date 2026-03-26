const express = require('express');
const {
    createPlanRequest,
    getPlanRequests,
    getPlanRequestById,
    updatePlanRequest,
    deletePlanRequest,
    approvePlanRequest,
    rejectPlanRequest
} = require('../controllers/planRequestController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// Only Superadmin can manage plan requests
router.post('/', authenticateToken, authorizeRoles('SUPERADMIN'), createPlanRequest);
router.post('/public/submit', createPlanRequest); // Public route for landing page
router.get('/', authenticateToken, authorizeRoles('SUPERADMIN'), getPlanRequests);
router.get('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), getPlanRequestById);
router.put('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), updatePlanRequest);
router.delete('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), deletePlanRequest);

// New semantic endpoints for Accept/Reject
router.put('/:id/approve', authenticateToken, authorizeRoles('SUPERADMIN'), approvePlanRequest);
router.put('/:id/reject', authenticateToken, authorizeRoles('SUPERADMIN'), rejectPlanRequest);

module.exports = router;
