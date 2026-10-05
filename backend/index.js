require('dotenv').config();
const express = require('express');
const cors = require('cors');
const functions = require('firebase-functions');

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

// Start local server if not running in Firebase
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG) {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

// Export the app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
