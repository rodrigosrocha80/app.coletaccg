const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/delivery-men - Listar todos os motoboys
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM delivery_men ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar motoboys:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/delivery-men - Criar um novo motoboy
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, vehicle_type, license_plate } = req.body;
    
    // Validação básica
    if (!name || !phone || !email || !vehicle_type || !license_plate) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const result = await pool.query(
      'INSERT INTO delivery_men (name, phone, email, vehicle_type, license_plate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, phone, email, vehicle_type, license_plate]
    );
    
    res.json({ success: true, deliveryMan: result.rows[0] });
  } catch (error) {
    console.error('Erro ao adicionar motoboy:', error);
    
    // Verificar se é um erro de duplicação de e-mail
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe um motoboy com este e-mail' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/delivery-men/:id - Obter um motoboy específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM delivery_men WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Motoboy não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar motoboy:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/delivery-men/:id - Atualizar um motoboy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, vehicle_type, license_plate, status } = req.body;
    
    const result = await pool.query(
      'UPDATE delivery_men SET name = $1, phone = $2, email = $3, vehicle_type = $4, license_plate = $5, status = $6 WHERE id = $7 RETURNING *',
      [name, phone, email, vehicle_type, license_plate, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Motoboy não encontrado' });
    }
    
    res.json({ success: true, deliveryMan: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar motoboy:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/delivery-men/:id - Excluir um motoboy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM delivery_men WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Motoboy não encontrado' });
    }
    
    res.json({ success: true, message: 'Motoboy excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir motoboy:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;