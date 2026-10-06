const API_BASE = 'http://localhost:3001/api';

async function checkMeetingPhotos() {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'meeting' })
  });
  const data = await res.json();
  
  console.log("Photos returned:", data.results.photos.map(p => p.photo_id));
}

checkMeetingPhotos();
