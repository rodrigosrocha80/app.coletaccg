const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// GET /api/users - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, 
             d.id as delivery_man_id, d.phone, d.vehicle_type, d.license_plate
      FROM users u
      LEFT JOIN delivery_men d ON u.email = d.email
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/users - Criar um novo usuário
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, password, role, phone, vehicle_type, license_plate } = req.body;

    await client.query('BEGIN');

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const userResult = await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hashedPassword, role]
    );

    const user = userResult.rows[0];

    // Se for um motoboy, criar também no cadastro de motoboys
    if (role === 'motoboy') {
      await client.query(
        'INSERT INTO delivery_men (name, phone, email, vehicle_type, license_plate) VALUES ($1, $2, $3, $4, $5)',
        [name, phone, email, vehicle_type, license_plate]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, user });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar usuário:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe um usuário com este email' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id - Atualizar um usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role, created_at',
      [name, email, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/users/:id - Excluir um usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;