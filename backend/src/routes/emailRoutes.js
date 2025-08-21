const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Rota para processar emails
router.post('/process', emailController.processEmails);

// Rota para testar conexão IMAP
router.get('/test-connection', emailController.testConnection);

// Rota para obter status do sistema
router.get('/status', emailController.getStatus);

// Rota para listar pedidos salvos
router.get('/orders', emailController.listOrders);

// Rota para testar banco de dados
router.get('/test-database', emailController.testDatabase);

// Rota para debug - analisar email sem salvar
router.get('/debug', emailController.debugEmail);

module.exports = router;

