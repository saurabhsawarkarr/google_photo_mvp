const API_BASE = 'http://localhost:3001/api';

async function search(query) {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(`\n--- Test: "${query}" ---`);
  console.log(`Clues parsed:`, data.understanding.clues.map(c => `${c.value} (${c.dimension})`));
  console.log(`Exact Matches: ${data.results.total_count}`);
}

async function runTests() {
  await search("Bithday"); // typo for birthday
  await search("Montain"); // typo for mountain
  await search("Beech"); // typo for beach
}

runTests();
