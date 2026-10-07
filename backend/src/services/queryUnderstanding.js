// src/services/queryUnderstanding.js

const fs = require('fs');
const path = require('path');
const photos = require('../data/samplePhotos.json');

function stemWord(w) {
  if (!w || w.length <= 3) return w;
  const lower = w.toLowerCase();
  if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y';
  if (lower.endsWith('es')) {
    if (lower.endsWith('ches') || lower.endsWith('shes') || lower.endsWith('sses') || lower.endsWith('xes')) {
      return lower.slice(0, -2);
    }
    return lower.slice(0, -1);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1);
  if (lower.endsWith('ing')) return lower.slice(0, -3);
  return lower;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a dynamic person dictionary from actual photo data
function getPersonNames() {
  try {
    const names = new Set();
    photos.forEach(p => {
      if (p.people) p.people.forEach(name => names.add(name.toLowerCase()));
    });
    return Array.from(names);
  } catch {
    return [];
  }
}

// Build a dynamic location dictionary from actual photo data
function getLocationLabels() {
  try {
    const locations = new Set();
    photos.forEach(p => {
      if (p.location?.label) locations.add(p.location.label.toLowerCase());
      if (p.location?.type) locations.add(p.location.type.toLowerCase());
    });
    return Array.from(locations);
  } catch {
    return [];
  }
}

// Build dynamic objects from actual photo data
function getObjects() {
  try {
    const objs = new Set();
    photos.forEach(p => {
      if (p.objects) p.objects.forEach(o => objs.add(o.toLowerCase()));
    });
    return Array.from(objs);
  } catch {
    return [];
  }
}

const dictionaries = {
  person: ['sister', 'brother', 'mom', 'dad', 'friend', 'friends', 'colleagues', 'teacher', 'students', 'athlete', 'kids', 'children', 'man', 'men', 'women', 'girl', 'boy', 'boys', ...getPersonNames()],
  location: ['farm', 'office', 'home', 'beach', 'beaches', 'garden', 'mountain', 'mountains', 'school', 'sports', 'gym', 'pool', 'stadium', 'court', 'park', 'forest', 'lake', ...getLocationLabels()],
  time: ['monsoon', 'summer', 'winter', 'spring', 'fall', 'autumn', '2021', '2022', '2023', '2024', '2025'],
  activity: ['planting trees', 'vacation', 'festival', 'party', 'working', 'meeting', 'studying', 'playing', 'swimming', 'running', 'hiking', 'trekking', 'jogging', 'riding', 'cycling', 'brainstorming', 'dining', 'cricket', 'soccer', 'football', 'volleyball', 'workout', 'jumping', 'kicking', 'batting'],
  object: ['shirt', 'shirts', 'blue shirt', 't-shirt', 'pants', 'sunflower', 'bee', 'flower', 'tree', 'trees', 'ganpati', 'statue', 'sand', 'ocean', 'computer', 'desk', 'bus', 'ball', 'bat', 'bicycle', 'bike', 'bicycles', 'car', 'laptop', 'phone', 'camera', 'book', 'backpack', 'tent', 'snow', 'cabin', 'chalet', 'whiteboard', ...getObjects()],
  visual: ['close-up', 'wide', 'front-facing', 'side', 'group', 'red', 'yellow', 'blue', 'green', 'orange', 'gold', 'sunset', 'sunrise', 'golden hour', 'colorful']
};

// Build all terms sorted by length descending so longer compound terms match first!
// Dimension priority: person > location > time > activity > object > visual
const allEntries = [];
const seenEntries = new Set();
for (const dim of ['person', 'location', 'time', 'activity', 'object', 'visual']) {
  for (const term of dictionaries[dim]) {
    const lower = term.toLowerCase().trim();
    if (!seenEntries.has(lower)) {
      seenEntries.add(lower);
      allEntries.push({ term: lower, dimension: dim });
    }
  }
}
allEntries.sort((a, b) => b.term.length - a.term.length);

function fallbackParseQuery(query) {
  const clues = [];
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return clues;

  let workingQuery = lowerQuery;
  const matchedTerms = new Set();

  for (const entry of allEntries) {
    const term = entry.term;
    const regex = new RegExp('\\b' + escapeRegex(term) + '\\b', 'i');
    if (regex.test(workingQuery)) {
      clues.push({
        clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        dimension: entry.dimension,
        value: term,
        confidence: 0.9,
        active: true,
        added_at: new Date().toISOString()
      });
      matchedTerms.add(term);
      workingQuery = workingQuery.replace(regex, ' '.repeat(term.length));
    }
  }

  // Also check stemmed single words if not matched
  if (clues.length === 0) {
    const words = lowerQuery.split(/[\s,]+/).filter(w => w.length > 2);
    for (const word of words) {
      const stem = stemWord(word);
      const matchedEntry = allEntries.find(e => e.term === stem);
      if (matchedEntry && !matchedTerms.has(matchedEntry.term)) {
        clues.push({
          clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dimension: matchedEntry.dimension,
          value: matchedEntry.term,
          confidence: 0.85,
          active: true,
          added_at: new Date().toISOString()
        });
        matchedTerms.add(matchedEntry.term);
      }
    }
  }

  if (clues.length === 0) {
    const originalWords = query.trim().split(/[\s,]+/);
    let properNounAdded = false;

    originalWords.forEach(word => {
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
        const wordLower = word.toLowerCase();
        if (!matchedTerms.has(wordLower)) {
          clues.push({
            clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            dimension: 'person',
            value: word,
            confidence: 0.4,
            active: true,
            added_at: new Date().toISOString()
          });
          matchedTerms.add(wordLower);
          properNounAdded = true;
        }
      }
    });

    if (!properNounAdded) {
      clues.push({
        clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        dimension: 'object',
        value: lowerQuery,
        confidence: 0.5,
        active: true,
        added_at: new Date().toISOString()
      });
    }
  }

  return clues;
}

function fallbackParseClue(clueText, dimensionHint) {
  const lower = clueText.toLowerCase().trim();
  if (!lower) return null;

  if (dimensionHint) {
    return {
      clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      dimension: dimensionHint,
      value: lower,
      confidence: 0.9,
      active: true,
      added_at: new Date().toISOString()
    };
  }

  // Find matching entries (longest first)
  const matchedDimensions = new Set();
  let primaryDimension = null;

  for (const entry of allEntries) {
    const regex = new RegExp('\\b' + escapeRegex(entry.term) + '\\b', 'i');
    if (regex.test(lower)) {
      if (!primaryDimension) {
        primaryDimension = entry.dimension;
      }
      matchedDimensions.add(entry.dimension);
    }
  }

  // If the EXACT word has true ambiguity across different dimensions (e.g., 'cricket')
  if (matchedDimensions.size > 1) {
    const exactMatches = allEntries.filter(e => e.term === lower);
    if (exactMatches.length > 1) {
      return {
        disambiguation: true,
        alternatives: exactMatches.map(m => ({
          clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dimension: m.dimension,
          value: lower,
          confidence: 0.9,
          active: true,
          added_at: new Date().toISOString()
        }))
      };
    }
  }

  return {
    clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    dimension: primaryDimension || 'object',
    value: lower,
    confidence: primaryDimension ? 0.9 : 0.5,
    active: true,
    added_at: new Date().toISOString()
  };
}

async function parseQuery(query) {
  const apiKey = process.env.GROQ_API_KEY;
  const isValidKey = apiKey && apiKey.startsWith('gsk_');
  if (!isValidKey) {
    console.log("No valid GROQ_API_KEY found. Falling back to dictionary parser.");
    return fallbackParseQuery(query);
  }

  try {
    const prompt = `You are a query parser for a photo search engine.
Extract the search clues from the following user query.
Map words to their base forms or core concepts (e.g., "playing", "play", "played" -> "playing").
Match them to these dimensions: person, location, time, activity, visual, object.

IMPORTANT RULES:
- Each word/concept should appear in EXACTLY ONE dimension — never duplicate across dimensions.
- "person" dimension is for people's names and roles (e.g., "Amit", "sister", "children").
- "location" dimension is for places (e.g., "beach", "office", "mountain").
- "time" dimension is for dates, seasons, years (e.g., "summer", "2023").
- "activity" dimension is for actions (e.g., "playing", "meeting", "running").
- "visual" dimension is for visual appearance (e.g., "sunset", "red", "colorful").
- "object" dimension is for things/items (e.g., "car", "laptop", "ball").
- If a word fits multiple dimensions, pick the MOST LIKELY one based on context.

Return ONLY a valid JSON object with a "clues" array. 
Format: {"clues": [{"dimension": "person", "value": "children"}, {"dimension": "activity", "value": "playing"}]}

User query: "${query}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const content = JSON.parse(data.choices[0].message.content);
    
    // Deduplicate: ensure no value appears in more than one dimension
    const seenValues = new Set();
    const deduped = [];
    for (const c of content.clues) {
      const normalized = c.value.toLowerCase();
      if (!seenValues.has(normalized)) {
        seenValues.add(normalized);
        deduped.push(c);
      }
    }
    
    return deduped.map(c => ({
      clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      dimension: c.dimension,
      value: c.value,
      confidence: 0.95,
      active: true,
      added_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error("LLM Parsing Error:", error.message);
    return fallbackParseQuery(query);
  }
}

async function parseClue(clueText, dimensionHint) {
  const apiKey = process.env.GROQ_API_KEY;
  const isValidKey = apiKey && apiKey.startsWith('gsk_');
  if (!isValidKey) return fallbackParseClue(clueText, dimensionHint);

  const clues = await parseQuery(clueText);
  if (clues && clues.length > 0) {
    // If dimension hint given, try to match it
    if (dimensionHint) {
      const match = clues.find(c => c.dimension === dimensionHint);
      if (match) return match;
      // If LLM didn't pick the hinted dimension, override it
      return { ...clues[0], dimension: dimensionHint };
    }
    return clues[0];
  }
  return fallbackParseClue(clueText, dimensionHint);
}

module.exports = {
  parseQuery,
  parseClue
};
