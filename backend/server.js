const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Importação de rotas
const emailRoutes = require('./src/routes/emailRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const routeRoutes = require('./src/routes/routeRoutes');
const deliveryMenRoutes = require('./src/routes/deliveryMenRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas
app.use('/api/email', emailRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/delivery-men', deliveryMenRoutes);

// Rota padrão
app.get('/', (req, res) => {
  res.send('Servidor do Sistema de Coletas está rodando!');
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});