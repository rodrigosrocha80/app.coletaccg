const express = require('express');
const cors = require('cors');
const supabase = require('./services/supabaseClient');
const { extractOrderData } = require('./services/emailProcessor');
const nodemailer = require('nodemailer');
const app = express();

app.use(cors());
app.use(express.json());

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Endpoint para processar e-mails
app.post('/process-email', async (req, res) => {
  try {
    const { emailBody } = req.body;
    const orderData = extractOrderData(emailBody);
    
    // Buscar fornecedor pelo código
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('supplier_code', orderData.supplierCode)
      .single();

    if (supplierError || !supplier) {
      throw new Error('Fornecedor não cadastrado');
    }

    // Inserir pedido
    const { error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderData.orderNumber,
        supplier_id: supplier.id,
        total_value: orderData.totalValue,
        email_body: emailBody
      });

    if (orderError) throw orderError;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para listar pedidos pendentes
app.get('/orders/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name, address)')
      .eq('status', 'pending');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para atualizar status do pedido
app.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});