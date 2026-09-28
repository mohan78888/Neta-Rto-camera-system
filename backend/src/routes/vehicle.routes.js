const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');

router.get('/:number', vehicleController.getVehicleRouteHistory);

module.exports = router;
