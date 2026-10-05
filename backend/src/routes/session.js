const express = require('express');
const router = express.Router();
const { getSession, updateSession, getActiveSessions } = require('../models/session');
const { searchPhotos } = require('../services/searchService');
const { getSuggestions } = require('../services/refinementEngine');

// GET /api/session/user/:id/active
router.get('/user/:id/active', (req, res) => {
  const activeSessions = getActiveSessions(req.params.id);
  res.json({ active_sessions: activeSessions });
});

// GET /api/session/:id
router.get('/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  // Re-hydrate session state (results and suggestions)
  const { photos, count } = searchPhotos(session.clues);
  const suggestions = getSuggestions(session, photos);
  
  res.json({
    session_id: session.session_id,
    understanding: { clues: session.clues },
    results: { photos, total_count: count },
    suggestions
  });
});

// PATCH /api/session/:id/resolve
router.patch('/:id/resolve', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  const { target_photo_id } = req.body;
  updateSession(req.params.id, { 
    status: 'resolved',
    resolved_photo_id: target_photo_id || null
  });
  
  res.json({ success: true, status: 'resolved' });
});

module.exports = router;
