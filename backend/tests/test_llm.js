require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { parseQuery } = require('../src/services/queryUnderstanding');

async function test() {
  console.log("Using API Key:", process.env.GROQ_API_KEY ? "YES" : "NO");
  const clues = await parseQuery("College");
  console.log("Clues for College:", clues);
  
  const cluesSchol = await parseQuery("Schol");
  console.log("Clues for Schol:", cluesSchol);
}
test();
