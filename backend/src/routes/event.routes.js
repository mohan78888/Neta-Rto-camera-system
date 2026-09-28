const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

router.get('/', eventController.getEvents);
router.post('/', eventController.createEvent);

module.exports = router;
