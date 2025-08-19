const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const emailRoutes = require('./src/routes/emailRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const userRoutes = require('./src/routes/userRoutes');
const routeRoutes = require('./src/routes/routeRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/email', emailRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do Sistema de Coletas está rodando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});