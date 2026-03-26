const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes are protected by authentication
router.use(authenticateToken);

router.post('/', clientController.createClient);
router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
