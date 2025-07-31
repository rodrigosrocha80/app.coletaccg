import { supabase } from './services/supabaseClient.js';
import { extractOrderData } from './services/emailProcessor.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para processar e-mails
app.post('/process-email', async (req, res) => {
  try {
    const { emailBody } = req.body;
    const orderData = extractOrderData(emailBody);
    
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('supplier_code', orderData.supplierCode)
      .single();

    if (!supplier) throw new Error('Supplier not found');

    const { error } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderData.orderNumber,
        supplier_id: supplier.id,
        total_value: orderData.totalValue,
        email_body: emailBody
      });

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});