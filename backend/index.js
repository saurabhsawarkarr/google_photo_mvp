require('dotenv').config();
const express = require('express');
const cors = require('cors');

const searchRoutes = require('./src/routes/search');
const refineRoutes = require('./src/routes/refine');
const sessionRoutes = require('./src/routes/session');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'https://google-photo-mvp.onrender.com', 'https://photos-mvp.web.app', 'https://photos-mvp.firebaseapp.com', 'https://saurabhsawarkarr.github.io'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE']
}));
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/session', refineRoutes);
app.use('/api/session', sessionRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: err.message });
});

// Start local server if running locally
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
