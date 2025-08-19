const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

router.post('/location', routeController.updateLocation);
router.get('/active/:deliveryManId', routeController.getActiveRoute);

module.exports = router;