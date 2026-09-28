const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', alertController.getAlerts);
router.patch('/:id', requireAuth, alertController.updateAlert);

module.exports = router;
