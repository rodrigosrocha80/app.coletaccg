const pool = require('../config/database');

exports.updateLocation = async (req, res) => {
  try {
    const { delivery_man_id, route_id, latitude, longitude } = req.body;

    const result = await pool.query(
      'INSERT INTO locations (delivery_man_id, route_id, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [delivery_man_id, route_id, latitude, longitude]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveRoute = async (req, res) => {
  try {
    const { deliveryManId } = req.params;

    const result = await pool.query(
      `SELECT r.* FROM routes r 
       WHERE r.delivery_man_id = $1 AND r.status = 'in_progress' 
       ORDER BY r.created_at DESC LIMIT 1`,
      [deliveryManId]
    );

    if (result.rows.length === 0) {
      return res.json({ active: false });
    }

    const route = result.rows[0];
    const progressResult = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN ro.status = 'collected' THEN 1 ELSE 0 END) as collected
       FROM route_orders ro 
       WHERE ro.route_id = $1`,
      [route.id]
    );

    const progress = progressResult.rows[0].total > 0 
      ? (progressResult.rows[0].collected / progressResult.rows[0].total) * 100 
      : 0;

    res.json({ active: true, route, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};