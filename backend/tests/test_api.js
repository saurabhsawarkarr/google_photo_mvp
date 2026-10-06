const API_BASE = 'http://localhost:3001/api';

async function test() {
  // 1. Create a search session with "Beach"
  const res1 = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Beach' })
  });
  const data1 = await res1.json();
  const sessionId = data1.session_id;
  console.log("Search 'Beach':", data1.results.total_count, "results");

  // 2. Add "Vikram" (person)
  const res2 = await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Vikram', dimension_hint: 'person' })
  });
  const data2 = await res2.json();
  console.log("Refine 'Vikram':", data2.results.total_count, "results");

  // 3. Add "Wide" (visual)
  const res3 = await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Wide', dimension_hint: 'visual' })
  });
  const data3 = await res3.json();
  console.log("Refine 'Wide':", data3.results.total_count, "results");

  // 4. Add "Riding" (activity)
  const res4 = await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Riding', dimension_hint: 'activity' })
  });
  const data4 = await res4.json();
  console.log("Refine 'Riding':", data4.results.total_count, "results");
  console.log("Final clues:", data4.understanding.clues.map(c => c.value + " (" + c.dimension + ")"));
}

test();
