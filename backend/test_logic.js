require('dotenv').config();
const { parseQuery } = require('./src/services/queryUnderstanding');
const { searchPhotos } = require('./src/services/searchService');

async function test() {
  const clues = await parseQuery("College");
  console.log("Clues for College:", clues);
  
  const cluesSchol = await parseQuery("Schol");
  console.log("Clues for Schol:", cluesSchol);
  
  const res1 = searchPhotos(clues);
  console.log("Search College exact count:", res1.count);
  
  const res2 = searchPhotos(cluesSchol);
  console.log("Search Schol exact count:", res2.count);
}
test();
