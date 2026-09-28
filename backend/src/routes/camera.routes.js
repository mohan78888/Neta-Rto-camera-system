const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');
const { requireRole } = require('../middleware/auth.middleware');

router.get('/', cameraController.getCameras);
router.post('/', requireRole('ADMIN'), cameraController.createCamera);
router.get('/:id', cameraController.getCameraById);
router.patch('/:id', requireRole('ADMIN'), cameraController.updateCamera);
router.delete('/:id', requireRole('ADMIN'), cameraController.deleteCamera);

module.exports = router;
