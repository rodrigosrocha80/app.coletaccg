const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/orders - Listar todos os pedidos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/orders/:id - Obter um pedido específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/orders/:id - Atualizar um pedido
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, collected_by } = req.body;
        
        const result = await pool.query(
            'UPDATE orders SET status = $1, collected_by = $2 WHERE id = $3 RETURNING *',
            [status, collected_by, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/orders/stats - Estatísticas de pedidos
router.get('/stats', async (req, res) => {
    try {
        const pendingResult = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['pending']);
        const collectedResult = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['collected']);

        res.json({
            pending: parseInt(pendingResult.rows[0].count),
            collected: parseInt(collectedResult.rows[0].count)
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;