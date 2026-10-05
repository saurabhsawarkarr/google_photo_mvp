// src/models/session.js
const { v4: uuidv4 } = require('uuid'); // Need to install uuid

// In-memory session store for MVP
const sessions = new Map();

function createSession(userId, initialClues) {
  const sessionId = uuidv4();
  const session = {
    session_id: sessionId,
    user_id: userId,
    created_at: new Date().toISOString(),
    status: 'active',
    clues: initialClues,
    refinement_history: [
      {
        step: 0,
        clues_state: JSON.parse(JSON.stringify(initialClues)),
        timestamp: new Date().toISOString()
      }
    ],
    suggested_dimensions: []
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (session) {
    Object.assign(session, updates);
    sessions.set(sessionId, session);
  }
  return session;
}

function addRefinementStep(sessionId, clues, resultCount) {
  const session = sessions.get(sessionId);
  if (session) {
    session.clues = clues;
    session.updated_at = new Date().toISOString();
    session.refinement_history.push({
      step: session.refinement_history.length,
      clues_state: JSON.parse(JSON.stringify(clues)),
      result_count: resultCount,
      timestamp: new Date().toISOString()
    });
    sessions.set(sessionId, session);
  }
  return session;
}

// Phase 4: Retrieve active sessions for a user (T8.2)
function getActiveSessions(userId) {
  const userSessions = [];
  for (const session of sessions.values()) {
    if (session.user_id === userId && session.status === 'active') {
      userSessions.push(session);
    }
  }
  // Sort by most recently updated
  return userSessions.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
}

// Phase 4: Session Expiry + Cleanup (T8.4)
// Run every hour in production; runs immediately here for simulation
setInterval(() => {
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    const sessionTime = new Date(session.updated_at || session.created_at).getTime();
    if (now - sessionTime > SEVEN_DAYS) {
      sessions.delete(id);
      console.log(`[Cleanup] Purged expired session: ${id}`);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  createSession,
  getSession,
  updateSession,
  addRefinementStep,
  getActiveSessions
};
