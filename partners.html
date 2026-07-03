const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { PORT } = require('./config');

const app = express();
const webDir = path.join(__dirname, '../web');

app.use(cors());
app.use(express.json());
app.use(express.static(webDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'meta-travel' });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`Meta Travel rodando em http://localhost:${PORT}`);
  console.log(`Planejador: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
