const fs = require('fs');
const path = require('path');

const categories = {
  school: 5,
  office: 3,
  sports: 5
};

const baseDir = path.resolve(__dirname, '../../../frontend/public/photos');

const downloadImage = async (url, filepath) => {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
};

async function main() {
  for (const [category, count] of Object.entries(categories)) {
    const catDir = path.join(baseDir, category);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
    
    for (let i = 1; i <= count; i++) {
      const filename = `${category}_${i}.jpg`;
      const filepath = path.join(catDir, filename);
      if (!fs.existsSync(filepath)) {
        console.log(`Downloading ${filename}...`);
        try {
          await downloadImage(`https://picsum.photos/seed/${category}_${i}/400/400`, filepath);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  console.log('Finished missing downloads');
}
main();
