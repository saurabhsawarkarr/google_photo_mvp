const API_BASE = 'http://localhost:3001/api';

async function checkBeaches() {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'beaches' })
  });
  const data = await res.json();
  
  console.log("Photos returned:", data.results.total_count);
  
  const objectSuggestions = data.suggestions.dimensions.find(d => d.key === 'object');
  if (objectSuggestions) {
    console.log("Suggested Objects:", objectSuggestions.suggested_values);
  } else {
    console.log("No object suggestions found.");
  }
}

checkBeaches();
