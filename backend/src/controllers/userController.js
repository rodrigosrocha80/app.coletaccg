const pool = require('../config/database');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let query = 'SELECT * FROM users WHERE email = $1';
    let params = [email];

    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    delete user.password;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};