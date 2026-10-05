// src/services/queryUnderstanding.js

const fs = require('fs');
const path = require('path');

// Build a dynamic person dictionary from actual photo data
function getPersonNames() {
  try {
    const filePath = path.join(__dirname, '../data/samplePhotos.json');
    const photos = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    const filePath = path.join(__dirname, '../data/samplePhotos.json');
    const photos = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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

const dictionaries = {
  person: ['sister', 'brother', 'mom', 'dad', 'friend', 'colleagues', 'teacher', 'students', 'athlete', ...getPersonNames()],
  location: ['farm', 'office', 'home', 'beach', 'garden', 'mountain', 'school', 'sports', 'gym', 'pool', 'stadium', 'court', 'park', 'forest', 'lake', ...getLocationLabels()],
  time: ['monsoon', 'summer', 'winter', 'spring', 'fall', 'autumn', '2021', '2022', '2023', '2024', '2025'],
  activity: ['planting trees', 'vacation', 'festival', 'party', 'working', 'meeting', 'studying', 'playing', 'swimming', 'running', 'hiking', 'trekking', 'jogging', 'riding', 'cycling', 'brainstorming', 'dining', 'cricket', 'soccer', 'football', 'volleyball', 'workout'],
  visual: ['close-up', 'wide', 'front-facing', 'side', 'group', 'red', 'yellow', 'blue', 'green', 'orange', 'gold', 'sunset', 'sunrise', 'golden hour', 'colorful'],
  object: ['sunflower', 'bee', 'flower', 'tree', 'ganpati', 'statue', 'sand', 'ocean', 'computer', 'desk', 'bus', 'ball', 'bat', 'bicycle', 'bike', 'car', 'laptop', 'phone', 'camera', 'book', 'backpack', 'tent', 'snow', 'cabin', 'chalet', 'whiteboard']
};

// Deduplicate dictionaries — ensure the same term doesn't appear in multiple dimensions
// Priority order: person > location > time > activity > visual > object
const seenTerms = new Set();
const deduplicatedDictionaries = {};
for (const dim of ['person', 'location', 'time', 'activity', 'visual', 'object']) {
  deduplicatedDictionaries[dim] = [];
  for (const term of dictionaries[dim]) {
    const lower = term.toLowerCase();
    if (!seenTerms.has(lower)) {
      seenTerms.add(lower);
      deduplicatedDictionaries[dim].push(term);
    }
  }
}

function fallbackParseQuery(query) {
  const clues = [];
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return clues;

  let matched = false;
  const matchedTerms = new Set(); // avoid duplicate clues for overlapping terms
  
  Object.keys(deduplicatedDictionaries).forEach(dimension => {
    deduplicatedDictionaries[dimension].forEach(term => {
      const termLower = term.toLowerCase();
      if (lowerQuery.includes(termLower) && !matchedTerms.has(termLower)) {
        // Check it's a word boundary match (not a substring of another word)
        const regex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerQuery)) {
          clues.push({
            clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            dimension: dimension,
            value: term,
            confidence: 0.9,
            active: true,
            added_at: new Date().toISOString()
          });
          matchedTerms.add(termLower);
          matched = true;
        }
      }
    });
  });

  if (!matched) {
    clues.push({
      clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      dimension: 'object',
      value: lowerQuery,
      confidence: 0.5,
      active: true,
      added_at: new Date().toISOString()
    });
  }

  return clues;
}

function fallbackParseClue(clueText, dimensionHint) {
  const lowerQuery = clueText.toLowerCase().trim();
  const matches = [];

  for (const dimension of Object.keys(deduplicatedDictionaries)) {
    for (const term of deduplicatedDictionaries[dimension]) {
      if (lowerQuery.includes(term.toLowerCase())) {
        matches.push({
           clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
           dimension: dimension,
           value: term,
           confidence: 0.9,
           active: true,
           added_at: new Date().toISOString()
        });
      }
    }
  }
  
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    // If we have a dimension hint, pick that one
    if (dimensionHint) {
      const hinted = matches.find(m => m.dimension === dimensionHint);
      if (hinted) return hinted;
    }
    return {
      disambiguation: true,
      alternatives: matches
    };
  }
  
  return {
     clue_id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
     dimension: dimensionHint || 'object',
     value: lowerQuery,
     confidence: 0.5,
     active: true,
     added_at: new Date().toISOString()
  };
}

async function parseQuery(query) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("No GROQ_API_KEY found. Falling back to dictionary parser.");
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
        model: "openai/gpt-oss-20b",
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
  if (!apiKey) return fallbackParseClue(clueText, dimensionHint);

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
