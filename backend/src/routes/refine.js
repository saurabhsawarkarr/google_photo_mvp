const express = require('express');
const router = express.Router();
const { parseClue } = require('../services/queryUnderstanding');
const { searchPhotos } = require('../services/searchService');
const { getSuggestions } = require('../services/refinementEngine');
const { getSession, addRefinementStep } = require('../models/session');

// POST /api/session/:id/refine
router.post('/:id/refine', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { new_clue_text, dimension_hint } = req.body;
    
    if (!new_clue_text || typeof new_clue_text !== 'string' || new_clue_text.length > 200) {
      return res.status(400).json({ error: 'Valid new_clue_text string is required' });
    }
    
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

  // 1. Parse the new clue
  const newClue = await parseClue(new_clue_text, dimension_hint);
  
  // Handle disambiguation (T4.4)
  if (newClue.disambiguation && !dimension_hint) {
    return res.json({
      session_id: session.session_id,
      disambiguation_required: true,
      alternatives: newClue.alternatives,
      understanding: { clues: session.clues }
    });
  }

  // If we had a dimension hint, pick the right alternative or just override
  const finalClue = newClue.disambiguation 
    ? newClue.alternatives.find(a => a.dimension === dimension_hint) || { ...newClue.alternatives[0], dimension: dimension_hint }
    : newClue;

  if (dimension_hint && !newClue.disambiguation) {
    finalClue.dimension = dimension_hint;
  }

  // Check if clue already exists and is active
  const alreadyActive = session.clues.some(c => 
    c.active && c.value.toLowerCase() === finalClue.value.toLowerCase()
  );
  
  const updatedClues = alreadyActive 
    ? session.clues 
    : [...session.clues, finalClue];

  // 3. Re-search
  const { photos, count, relaxed_photos } = searchPhotos(updatedClues);

  // 4. Zero-result protection
  if (count === 0 && !alreadyActive) {
    const prevResults = searchPhotos(session.clues);
    return res.json({
      session_id: session.session_id,
      zero_results: true,
      rejected_clue: finalClue,
      understanding: { clues: session.clues },
      results: { photos: prevResults.photos, relaxed_photos: prevResults.relaxed_photos, total_count: prevResults.count },
      suggestions: getSuggestions(session, prevResults.photos)
    });
  }

  // 5. Update session
  addRefinementStep(sessionId, updatedClues, count);

  // 6. Get new suggestions
  const suggestions = getSuggestions(session, photos);
  session.suggested_dimensions = suggestions.dimensions.map(d => d.key);

  res.json({
    session_id: session.session_id,
    refinement_history: session.refinement_history,
    understanding: {
      clues: updatedClues,
      new_clue_parsed: finalClue
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

// DELETE /api/session/:id/clue/:clue_id
router.delete('/:id/clue/:clue_id', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const clueId = req.params.clue_id;
    
    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

  // 1. Remove/deactivate clue
  const removedClue = session.clues.find(c => c.clue_id === clueId);
  const updatedClues = session.clues.map(c => {
    if (c.clue_id === clueId) return { ...c, active: false };
    return c;
  });

  // 2. Re-search
  const { photos, count, relaxed_photos } = searchPhotos(updatedClues);

  // 3. Update session
  addRefinementStep(sessionId, updatedClues, count);

  // 4. Get new suggestions
  const suggestions = getSuggestions(session, photos);

  res.json({
    session_id: session.session_id,
    refinement_history: session.refinement_history,
    understanding: { clues: updatedClues },
    removed_clue: removedClue,
    results: { photos, relaxed_photos, total_count: count },
    suggestions
  });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
