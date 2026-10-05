const API_BASE = 'http://localhost:3001/api';

async function checkAllFilters(query) {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  
  console.log(`\n=== Verification for Query: "${query}" ===`);
  console.log(`Photos matched: ${data.results.total_count}`);
  
  if (data.results.total_count === 0) {
    console.log("No exact photos found. Suggestions may be fallback or empty.");
  }
  
  const dimensions = ['person', 'location', 'time', 'activity', 'visual', 'object'];
  
  dimensions.forEach(dim => {
    const dimSuggestions = data.suggestions.dimensions.find(d => d.key === dim);
    if (dimSuggestions && dimSuggestions.suggested_values.length > 0) {
      console.log(`[${dim.toUpperCase()}] Suggestions: ${dimSuggestions.suggested_values.join(', ')}`);
    } else {
      console.log(`[${dim.toUpperCase()}] Suggestions: None`);
    }
  });
}

async function runTests() {
  await checkAllFilters('meeting');
  await checkAllFilters('beaches');
  await checkAllFilters('sports');
  await checkAllFilters('snow');
}

runTests();
