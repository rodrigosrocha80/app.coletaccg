const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/routes - Listar todas as rotas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, d.name as delivery_man_name 
      FROM routes r 
      LEFT JOIN delivery_men d ON r.delivery_man_id = d.id 
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar rotas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/routes - Criar uma nova rota
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, delivery_man_id, order_ids } = req.body;

    await client.query('BEGIN');

    // Inserir a rota
    const routeResult = await client.query(
      'INSERT INTO routes (name, delivery_man_id, status) VALUES ($1, $2, $3) RETURNING *',
      [name, delivery_man_id, 'planned']
    );

    const route = routeResult.rows[0];

    // Associar pedidos à rota
    for (let i = 0; i < order_ids.length; i++) {
      await client.query(
        'INSERT INTO route_orders (route_id, order_id, sequence) VALUES ($1, $2, $3)',
        [route.id, order_ids[i], i + 1]
      );

      // Atualizar status do pedido para "em rota"
      await client.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['in_route', order_ids[i]]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, route });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// GET /api/routes/:id - Obter uma rota específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const routeResult = await pool.query(`
      SELECT r.*, d.name as delivery_man_name 
      FROM routes r 
      LEFT JOIN delivery_men d ON r.delivery_man_id = d.id 
      WHERE r.id = $1
    `, [id]);
    
    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rota não encontrada' });
    }
    
    const route = routeResult.rows[0];
    
    // Buscar pedidos da rota
    const ordersResult = await pool.query(`
      SELECT o.*, ro.sequence 
      FROM orders o 
      JOIN route_orders ro ON o.id = ro.order_id 
      WHERE ro.route_id = $1 
      ORDER BY ro.sequence
    `, [id]);
    
    route.orders = ordersResult.rows;
    
    res.json(route);
  } catch (error) {
    console.error('Erro ao buscar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/routes/:id/complete - Finalizar uma rota
router.put('/:id/complete', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Atualizar status da rota
    const routeResult = await client.query(
      'UPDATE routes SET status = $1, end_time = NOW() WHERE id = $2 RETURNING *',
      ['completed', id]
    );

    if (routeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Rota não encontrada' });
    }

    const route = routeResult.rows[0];

    // Atualizar status dos pedidos para "coletado"
    await client.query(
      'UPDATE orders SET status = $1 WHERE id IN (SELECT order_id FROM route_orders WHERE route_id = $2)',
      ['collected', id]
    );

    await client.query('COMMIT');
    res.json({ success: true, route });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao finalizar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

module.exports = router;