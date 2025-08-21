const pool = require('../config/database');

exports.getOrders = async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = 'SELECT * FROM orders';
    let params = [];

    if (status) {
      query += ' WHERE status = $1', ['PENDENTE'];
      params.push(status);
    }

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const pendingResult = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['PENDENTE']);
    const collectedResult = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['COLETADO']);

    res.json({
      pending: parseInt(pendingResult.rows[0].count),
      collected: parseInt(collectedResult.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};