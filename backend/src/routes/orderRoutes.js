const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/orders/stats - Estatísticas de pedidos (DEVE VIR PRIMEIRO)
router.get('/stats', async (req, res) => {
  try {
    const pendingResult = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE status = $1', 
      ['PENDENTE']
    );
    const collectedResult = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE status = $1', 
      ['COLETADO']
    );

    res.json({
      pending: parseInt(pendingResult.rows[0].count),
      collected: parseInt(collectedResult.rows[0].count)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/orders/pending - Listar pedidos pendentes
router.get('/pending', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC',
      ['PENDENTE']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pedidos pendentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/orders - Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = 'SELECT * FROM orders';
    let params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
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
    
    // Verificar se o ID é um número válido
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do pedido deve ser um número' });
    }
    
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
    
    // Verificar se o ID é um número válido
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID do pedido deve ser um número' });
    }
    
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

module.exports = router;