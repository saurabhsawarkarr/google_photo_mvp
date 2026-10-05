require('dotenv').config();
const express = require('express');
const cors = require('cors');

const searchRoutes = require('./src/routes/search');
const refineRoutes = require('./src/routes/refine');
const sessionRoutes = require('./src/routes/session');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/session', refineRoutes);
app.use('/api/session', sessionRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
