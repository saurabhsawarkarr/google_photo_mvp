const API_BASE = 'http://localhost:3001/api';

async function test() {
  const res1 = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Beach' })
  });
  const data1 = await res1.json();
  const sessionId = data1.session_id;

  await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Vikram', dimension_hint: 'person' })
  });
  await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Wide', dimension_hint: 'visual' })
  });
  
  const res4 = await fetch(`${API_BASE}/session/${sessionId}/refine`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_clue_text: 'Riding', dimension_hint: 'activity' })
  });
  const data4 = await res4.json();
  
  console.log("Total Count:", data4.results.total_count);
  console.log("Photos Length:", data4.results.photos.length);
  console.log("Relaxed Photos Length:", data4.results.relaxed_photos.length);
}

test();
