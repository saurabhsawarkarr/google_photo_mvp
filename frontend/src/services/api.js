// src/services/api.js

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function search(query) {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_id: 'test_user' })
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function refineSession(sessionId, clueText, dimensionHint) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: clueText, dimension_hint: dimensionHint })
  });
  if (!res.ok) throw new Error('Refine failed');
  return res.json();
}

export async function removeClue(sessionId, clueId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}/clue/${clueId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Remove clue failed');
  return res.json();
}

export async function getActiveSessions(userId) {
  const res = await fetch(`${API_BASE}/session/user/${userId}/active`);
  if (!res.ok) throw new Error('Fetch sessions failed');
  return res.json();
}

export async function resumeSession(sessionId) {
  const res = await fetch(`${API_BASE}/session/${sessionId}`);
  if (!res.ok) throw new Error('Resume session failed');
  return res.json();
}
