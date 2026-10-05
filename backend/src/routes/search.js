const express = require('express');
const router = express.Router();
const { parseQuery } = require('../services/queryUnderstanding');
const { searchPhotos } = require('../services/searchService');
const { getSuggestions } = require('../services/refinementEngine');
const { createSession } = require('../models/session');

// POST /api/search
router.post('/', async (req, res, next) => {
  try {
    const { query, user_id } = req.body;
    if (query === undefined) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // 1. Parse initial query
    const initialClues = await parseQuery(query);
    console.log("DEBUG: query=", query, "initialClues=", initialClues);

    // 2. Create session
    const session = createSession(user_id || 'anonymous', initialClues);

    // 3. Search
    const { photos, count, relaxed_photos } = searchPhotos(session.clues);
    
    // 4. Update session history
    session.refinement_history[0].result_count = count;

    // 5. Get suggestions
    const suggestions = getSuggestions(session, photos);
    session.suggested_dimensions = suggestions.dimensions.map(d => d.key);

    res.json({
      session_id: session.session_id,
      understanding: {
        clues: session.clues
      },
      results: {
        photos,
        relaxed_photos,
        total_count: count
      },
      suggestions
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
