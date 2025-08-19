const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/process', emailController.processEmails);

module.exports = router;