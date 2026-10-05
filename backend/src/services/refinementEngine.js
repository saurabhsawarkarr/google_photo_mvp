// src/services/refinementEngine.js
const fs = require('fs');
const path = require('path');

function getSamplePhotos() {
  const filePath = path.join(__dirname, '../data/samplePhotos.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const ALL_DIMENSIONS = [
  { key: 'person', label: 'Who', icon: '👤' },
  { key: 'location', label: 'Where', icon: '📍' },
  { key: 'time', label: 'When', icon: '📅' },
  { key: 'activity', label: 'What happened', icon: '🎯' },
  { key: 'visual', label: 'What it looked like', icon: '🖼️' },
  { key: 'object', label: 'Objects', icon: '📦' }
];

// Non-object terms that must never appear in the Objects dimension
const NON_OBJECT_STOPWORDS = new Set([
  'people', 'person', 'tourists', 'tourist', 'boys', 'boy', 'child', 'children', 
  'friends', 'friend', 'family', 'students', 'student', 'teacher', 'man', 'men', 
  'women', 'woman', 'hiker', 'spectators', 'teenagers', 'girl', 'coworkers', 
  'colleagues', 'employees', 'parent', 'kids', 'kid',
  'sand', 'white sand', 'nature', 'landscape', 'scenic', 'view', 'grass', 'grass field', 
  'water', 'clear water', 'sky', 'blue sky', 'clouds', 'horizon', 'dirt', 'dusty field', 
  'cliff', 'rocks', 'ice', 'snow', 'sea', 'waves', 'ocean', 'coast', 'coastline', 
  'shore', 'shoreline', 'turf', 'beach', 'mountain', 'alps', 'peaks', 'ridge', 
  'forest', 'greenery', 'trees', 'pine trees', 'palm trees', 'lake', 'valley',
  'summer', 'winter', 'spring', 'monsoon', 'fall', 'autumn', 'daytime', 'evening', 
  'night', 'morning', 'dusk', 'dawn', 'golden hour', 'cold', 'frozen', 'bright', 
  'colorful', 'sunny', 'sunshine', 'active', 'activewear', 'athletic', 'fitness', 
  'team', 'teamwork', 'match', 'jumping', 'recreation', 'fun', 'vacation', 'holiday', 
  'peaceful', 'serene', 'destination', 'exotic', 'modern', 'creative', 'corporate', 
  'business', 'education', 'technology', 'productivity', 'solitude', 'expedition', 
  'remote', 'looking away', 'bonding', 'leisure', 'indoor', 'outdoor', 'outdoors', 
  'health', 'strength', 'squats', 'bear crawl', 'footprints', 'wide', 'close-up', 
  'panoramic', 'silhouette', 'front-facing', 'side', 'group', 'adventure', 'learning'
]);

// Physical tangible objects
const KNOWN_OBJECTS = new Set([
  'volleyball', 'ball', 'bat', 'red ball', 'tennis ball', 'net', 'wicket',
  'bicycle', 'bicycles', 'mountain bike', 'bike', 'backpack', 'backpacks',
  'laptop', 'computer', 'computers', 'desk', 'desks', 'coffee cup', 'coffee',
  'camera', 'phone', 'smartwatch', 'bus', 'yellow bus', 'whiteboard', 'chalkboard',
  'book', 'books', 'notebook', 'slide', 'kettlebell', 'battle ropes', 'bricks',
  'tent', 'cabin', 'chalet', 'hat', 'lockers', 'flower', 'sunflower',
  'blue shirt', 'red pants'
]);

// Activity keywords that belong in the activity dimension
const ACTIVITY_KEYWORDS = new Set([
  'playing', 'running', 'swimming', 'walking', 'trekking', 'working',
  'chatting', 'dining', 'riding', 'workout', 'batting', 'studying',
  'hiking', 'jogging', 'cycling', 'kicking', 'jumping', 'brainstorming',
  'relaxing', 'standing', 'sitting', 'writing', 'reading', 'cooking',
  'dancing', 'singing', 'fishing', 'camping', 'climbing', 'surfing',
  'cricket', 'volleyball', 'soccer', 'football'
]);

// Location-related terms
const LOCATION_TERMS = new Set([
  'mountain', 'beach', 'office', 'school', 'sports', 'gym', 'park',
  'farm', 'garden', 'pool', 'stadium', 'court', 'home', 'forest',
  'lake', 'river', 'ocean', 'sea', 'coast', 'city', 'village',
  'temple', 'church', 'hospital', 'market', 'restaurant', 'cafe',
  'goa', 'breakroom', 'classroom', 'conference room'
]);

// Time-related terms
const TIME_TERMS = new Set([
  'summer', 'winter', 'spring', 'monsoon', 'fall', 'autumn',
  'morning', 'evening', 'night', 'daytime', 'dusk', 'dawn', '2021', '2022', '2023', '2024'
]);

// Composition/technical terms that aren't useful to show users
const SKIP_VISUAL_TERMS = new Set([
  'wide', 'close-up', 'front-facing', 'side', 'panoramic'
]);

function getSuggestions(session, currentPhotos = []) {
  const activeClues = session.clues.filter(c => c.active);
  const usedDimensions = activeClues.map(c => c.dimension);
  const samplePhotos = getSamplePhotos();

  // If currentPhotos has few results, pool with samplePhotos to offer discovery options
  const pool = (currentPhotos.length > 0) ? currentPhotos : samplePhotos;
  
  const suggestions = [...ALL_DIMENSIONS].map(dim => {
    const valuesMap = {};
    
    pool.forEach(photo => {
      let values = [];
      
      if (dim.key === 'person') {
        values = [...(photo.people || [])];
        // Also include human roles
        (photo.objects || []).forEach(o => {
          const lower = o.toLowerCase();
          if (['children', 'students', 'teacher', 'friends', 'tourists', 'colleagues'].includes(lower)) {
            values.push(lower);
          }
        });
      }
      
      if (dim.key === 'location') {
        if (photo.location?.label) values = [photo.location.label];
      }
      
      if (dim.key === 'time') {
        if (photo.timestamp) {
          values = [photo.timestamp.season, String(photo.timestamp.year)].filter(Boolean);
        }
      }
      
      if (dim.key === 'activity') {
        values = (photo.objects || []).filter(obj => ACTIVITY_KEYWORDS.has(obj.toLowerCase()));
        const sceneWords = (photo.scene || '').toLowerCase().split(/[\s,.-]+/);
        sceneWords.forEach(w => {
          if (ACTIVITY_KEYWORDS.has(w) && !values.some(v => v.toLowerCase() === w)) {
            values.push(w);
          }
        });
      }
      
      if (dim.key === 'visual') {
        const colors = (photo.visual_attributes?.dominant_colors || [])
          .filter(c => !SKIP_VISUAL_TERMS.has(c.toLowerCase()));
        values = [...colors];
        if (photo.scene?.toLowerCase().includes('sunset')) values.push('Sunset');
        if (photo.scene?.toLowerCase().includes('snow')) values.push('Snowy');
      }
      
      if (dim.key === 'object') {
        values = (photo.objects || []).filter(obj => KNOWN_OBJECTS.has(obj.toLowerCase()));
      }

      values.forEach(v => {
        if (!v) return;
        const normalized = String(v).toLowerCase().trim();
        if (!normalized) return;
        
        // Don't suggest values that are already active clues
        const isAlreadyActive = activeClues.some(c => {
           const clueVal = c.value.toLowerCase();
           return clueVal === normalized || clueVal.includes(normalized) || normalized.includes(clueVal);
        });

        if (!isAlreadyActive) {
          if (!valuesMap[normalized]) {
            const displayName = String(v).charAt(0).toUpperCase() + String(v).slice(1);
            valuesMap[normalized] = { display: displayName, count: 0 };
          }
          valuesMap[normalized].count++;
        }
      });
    });

    // If pool was currentPhotos and yielded fewer than 4 suggestions, add popular items from samplePhotos
    if (pool !== samplePhotos && Object.keys(valuesMap).length < 4) {
      samplePhotos.forEach(photo => {
        let fallbackValues = [];
        if (dim.key === 'person') fallbackValues = photo.people || [];
        if (dim.key === 'location' && photo.location?.label) fallbackValues = [photo.location.label];
        if (dim.key === 'time' && photo.timestamp) fallbackValues = [photo.timestamp.season, String(photo.timestamp.year)].filter(Boolean);
        if (dim.key === 'activity') fallbackValues = (photo.objects || []).filter(obj => ACTIVITY_KEYWORDS.has(obj.toLowerCase()));
        if (dim.key === 'visual') fallbackValues = (photo.visual_attributes?.dominant_colors || []).filter(c => !SKIP_VISUAL_TERMS.has(c.toLowerCase()));
        if (dim.key === 'object') fallbackValues = (photo.objects || []).filter(obj => KNOWN_OBJECTS.has(obj.toLowerCase()));

        fallbackValues.forEach(v => {
          if (!v) return;
          const normalized = String(v).toLowerCase().trim();
          if (!normalized) return;
          const isAlreadyActive = activeClues.some(c => c.value.toLowerCase() === normalized);
          if (!isAlreadyActive && !valuesMap[normalized]) {
            const displayName = String(v).charAt(0).toUpperCase() + String(v).slice(1);
            valuesMap[normalized] = { display: displayName, count: 0 };
          }
        });
      });
    }

    // Rank suggested values by frequency, return display names
    const sortedValues = Object.values(valuesMap)
      .sort((a, b) => b.count - a.count)
      .map(entry => entry.display)
      .slice(0, 6);

    return {
      ...dim,
      estimated_reduction: Math.random() * 0.5 + 0.3,
      suggested_values: sortedValues
    };
  });
  
  // Sort to put unfilled dimensions first
  suggestions.sort((a, b) => {
    const aUsed = usedDimensions.includes(a.key);
    const bUsed = usedDimensions.includes(b.key);
    if (aUsed && !bUsed) return 1;
    if (!aUsed && bUsed) return -1;
    return b.estimated_reduction - a.estimated_reduction;
  });

  return {
    prompt: "Narrow down with other details you remember.",
    dimensions: suggestions
  };
}

module.exports = {
  getSuggestions
};
