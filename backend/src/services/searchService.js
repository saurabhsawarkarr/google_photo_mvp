// src/services/searchService.js
const fs = require('fs');
const path = require('path');

const samplePhotos = require('../data/samplePhotos.json');

function getSamplePhotos() {
  return samplePhotos;
}

// Helper: Levenshtein distance for fuzzy spelling match
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

// Clean synonym map for precise matching
const SYNONYM_MAP = {
  sea: ['sea', 'ocean'],
  ocean: ['sea', 'ocean'],
  beach: ['beach', 'seashore', 'coast', 'coastline'],
  coast: ['coast', 'beach', 'seashore', 'shore'],
  goa: ['goa', 'beach'],
  mountain: ['mountain', 'mountains', 'peak', 'ridge', 'alpine'],
  mountains: ['mountain', 'mountains', 'peak', 'ridge', 'alpine'],
  hill: ['mountain', 'hill'],
  school: ['school', 'college', 'university', 'classroom'],
  college: ['school', 'college', 'university', 'classroom'],
  university: ['school', 'college', 'university'],
  bike: ['bike', 'bicycle', 'cycle', 'cycling'],
  bicycle: ['bicycle', 'bike', 'cycle', 'cycling'],
  cycle: ['cycle', 'cycling', 'bike', 'bicycle'],
  cycling: ['cycling', 'cycle', 'bike', 'bicycle'],
  hike: ['hike', 'hiking', 'trek', 'trekking'],
  hiking: ['hiking', 'hike', 'trek', 'trekking'],
  trek: ['trek', 'trekking', 'hike', 'hiking'],
  trekking: ['trekking', 'trek', 'hike', 'hiking'],
  run: ['run', 'running', 'jogging', 'jog'],
  running: ['run', 'running', 'jogging', 'jog'],
  jogging: ['run', 'running', 'jogging', 'jog'],
  swim: ['swim', 'swimming'],
  swimming: ['swim', 'swimming'],
  soccer: ['soccer', 'football'],
  football: ['football', 'soccer'],
  cricket: ['cricket', 'street cricket'],
  volleyball: ['volleyball', 'beach volleyball'],
  cafe: ['cafe', 'coffee shop', 'chalet'],
  restaurant: ['restaurant', 'dining'],
  gym: ['gym', 'workout', 'fitness'],
  workout: ['workout', 'gym', 'fitness', 'exercise'],
  fitness: ['fitness', 'workout', 'gym'],
  sunset: ['sunset', 'dusk', 'evening', 'golden hour'],
  sunrise: ['sunrise', 'dawn', 'morning'],
  snow: ['snow', 'ice', 'snowy'],
  kids: ['kids', 'children', 'child', 'kid'],
  children: ['children', 'child', 'kids', 'kid'],
  child: ['child', 'children', 'kid', 'kids'],
  vacation: ['vacation', 'holiday', 'trip'],
  holiday: ['holiday', 'vacation', 'trip'],
  meeting: ['meeting', 'conference room', 'presentation'],
  work: ['work', 'working', 'office'],
  working: ['working', 'work', 'office'],
};

function getSynonyms(word) {
  const w = word.toLowerCase();
  return SYNONYM_MAP[w] || [w];
}

function matchClueOnPhoto(clue, photo) {
  const dim = clue.dimension || 'unknown';
  const val = clue.value.toLowerCase().trim();
  if (!val) return 0;

  const synonyms = getSynonyms(val);
  const words = val.split(/[\s,]+/).filter(w => w.length > 1);

  let bestScore = 0;

  const checkFields = [];
  if (dim === 'person') {
    checkFields.push({ texts: photo.people || [], weight: 1.0 });
    checkFields.push({ texts: [photo.scene], weight: 0.85 });
  } else if (dim === 'location') {
    checkFields.push({ texts: [photo.location?.label, photo.location?.type].filter(Boolean), weight: 1.0 });
    checkFields.push({ texts: [photo.scene], weight: 0.85 });
  } else if (dim === 'time') {
    checkFields.push({ texts: [photo.timestamp?.season, String(photo.timestamp?.year)].filter(Boolean), weight: 1.0 });
    checkFields.push({ texts: [photo.scene], weight: 0.85 });
  } else if (dim === 'activity') {
    checkFields.push({ texts: photo.objects || [], weight: 0.95 });
    checkFields.push({ texts: [photo.scene], weight: 1.0 });
  } else if (dim === 'visual') {
    checkFields.push({ texts: photo.visual_attributes?.dominant_colors || [], weight: 1.0 });
    checkFields.push({ texts: [photo.visual_attributes?.composition, photo.scene].filter(Boolean), weight: 0.85 });
  } else if (dim === 'object') {
    checkFields.push({ texts: photo.objects || [], weight: 1.0 });
    checkFields.push({ texts: [photo.scene], weight: 0.85 });
  } else {
    checkFields.push({ texts: photo.people || [], weight: 1.0 });
    checkFields.push({ texts: [photo.location?.label, photo.location?.type].filter(Boolean), weight: 1.0 });
    checkFields.push({ texts: [photo.timestamp?.season, String(photo.timestamp?.year)].filter(Boolean), weight: 1.0 });
    checkFields.push({ texts: photo.objects || [], weight: 1.0 });
    checkFields.push({ texts: [photo.scene], weight: 0.9 });
    checkFields.push({ texts: photo.visual_attributes?.dominant_colors || [], weight: 0.85 });
  }

  const candidateTerms = new Set([val, ...synonyms]);
  for (const w of words) {
    candidateTerms.add(w);
    getSynonyms(w).forEach(s => candidateTerms.add(s));
  }

  for (const term of candidateTerms) {
    const isExactUserVal = (term === val);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundaryRegex = new RegExp(`\\b${escaped}\\b`, 'i');

    for (const field of checkFields) {
      for (const t of field.texts) {
        if (!t) continue;
        const str = String(t).toLowerCase();

        if (wordBoundaryRegex.test(str)) {
          let score = field.weight * (isExactUserVal ? 1.0 : 0.92);
          if (score > bestScore) bestScore = score;
        } else if (str.includes(term) && term.length >= 4) {
          let score = field.weight * (isExactUserVal ? 0.95 : 0.88);
          if (score > bestScore) bestScore = score;
        } else if (term.length >= 4) {
          const targetWords = str.split(/[\s,.\-]+/).filter(tw => tw.length >= 3);
          for (const tw of targetWords) {
            const allowed = term.length >= 6 ? 1 : 0;
            if (allowed > 0 && Math.abs(tw.length - term.length) <= allowed) {
              if (levenshtein(tw, term) <= allowed) {
                let score = field.weight * 0.78;
                if (score > bestScore) bestScore = score;
              }
            }
          }
        }
      }
    }
  }

  return bestScore;
}

function searchPhotos(clues) {
  const samplePhotos = getSamplePhotos();
  const activeClues = clues.filter(c => c.active);
  
  if (activeClues.length === 0) {
    console.log("[searchPhotos] No active clues, returning all", samplePhotos.length, "photos");
    return { photos: samplePhotos, count: samplePhotos.length };
  }

  const totalClues = activeClues.length;
  console.log(`[searchPhotos] activeClues: ${JSON.stringify(activeClues.map(c => c.value))} (total: ${totalClues})`);

  // Group clues by dimension
  const cluesByDimension = {};
  for (const clue of activeClues) {
    const dim = clue.dimension || 'unknown';
    if (!cluesByDimension[dim]) cluesByDimension[dim] = [];
    cluesByDimension[dim].push(clue);
  }
  const totalDimensions = Object.keys(cluesByDimension).length;

  const scoredPhotos = samplePhotos.map(photo => {
    let dimsMatched = 0;
    let totalQuality = 0;

    for (const dim of Object.keys(cluesByDimension)) {
      const dimClues = cluesByDimension[dim];
      let bestScoreForDim = 0;
      for (const clue of dimClues) {
        const q = matchClueOnPhoto(clue, photo);
        if (q > bestScoreForDim) bestScoreForDim = q;
      }
      if (bestScoreForDim > 0) {
        dimsMatched++;
        totalQuality += bestScoreForDim;
      }
    }

    let match_percentage = 0;
    if (dimsMatched === totalDimensions) {
      const avgQ = totalQuality / totalDimensions;
      match_percentage = Math.min(99, Math.max(86, Math.round(84 + (avgQ * 14))));
    } else if (dimsMatched > 0) {
      const ratio = dimsMatched / totalDimensions;
      const avgQ = totalQuality / dimsMatched;
      match_percentage = Math.min(75, Math.max(38, Math.round((ratio * 50) + (avgQ * 20))));
    }

    const match_score = +(match_percentage / 100).toFixed(2);
    const enrichedPhoto = {
      ...photo,
      match_percentage,
      match_score
    };

    return { photo: enrichedPhoto, dimsMatched, match_percentage };
  });

  const exactMatches = scoredPhotos.filter(p => p.dimsMatched === totalDimensions);
  exactMatches.sort((a, b) => b.match_percentage - a.match_percentage);
  const results = exactMatches.map(p => p.photo);
  console.log(`[searchPhotos] exactMatches count: ${results.length}`);

  let relaxedResults = [];
  if (results.length === 0 && totalDimensions > 1) {
    const relaxedMatches = scoredPhotos.filter(p => p.dimsMatched > 0);
    relaxedMatches.sort((a, b) => b.dimsMatched - a.dimsMatched || b.match_percentage - a.match_percentage);
    relaxedResults = relaxedMatches.map(p => p.photo);
  }

  return {
    photos: results,
    relaxed_photos: relaxedResults,
    count: results.length
  };
}

module.exports = {
  searchPhotos
};
