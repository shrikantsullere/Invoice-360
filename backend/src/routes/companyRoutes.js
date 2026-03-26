const express = require('express');
const {
    createCompany,
    getCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany
} = require('../controllers/companyController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { upload } = require('../utils/cloudinaryConfig');

const router = express.Router();

// Middleware to check if user has access to this company
const checkCompanyAccess = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;
    const requestedCompanyId = req.params.id;

    if (userRole === 'SUPERADMIN') return next();

    // If the user is associated with this company, allow access
    if (userCompanyId != null && userCompanyId.toString() === requestedCompanyId.toString()) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied: You do not have permission to access this company' });
};

// Only Superadmin can create or delete companies
router.post('/', authenticateToken, authorizeRoles('SUPERADMIN'), upload.single('logo'), createCompany);
router.get('/', authenticateToken, authorizeRoles('SUPERADMIN'), getCompanies);
router.delete('/:id', authenticateToken, authorizeRoles('SUPERADMIN'), deleteCompany);

// Both Superadmin and Company Admin can view/update their own company
router.get('/:id', authenticateToken, checkCompanyAccess, getCompanyById);
router.put('/:id', authenticateToken, checkCompanyAccess, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'invoiceLogo', maxCount: 1 }]), updateCompany);

module.exports = router;
