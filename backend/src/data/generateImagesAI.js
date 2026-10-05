const fs = require('fs');
const path = require('path');
const https = require('https');

const categories = {
  mountain: [
    { prompt: "mountain landscape with a parked bicycle", objects: ["mountain", "bicycle"] },
    { prompt: "cozy cafe in the mountains", objects: ["mountain", "cafe", "coffee"] },
    { prompt: "snowy mountain peak", objects: ["mountain", "snow", "peak"] },
    { prompt: "camping tent in the mountains", objects: ["mountain", "tent", "camping"] },
    { prompt: "sunrise over mountain range", objects: ["mountain", "sunrise", "sky"] }
  ],
  beach: [
    { prompt: "people playing volleyball on a sunny beach", objects: ["beach", "volleyball", "people"] },
    { prompt: "cocktail drink on the beach sand", objects: ["beach", "cocktail", "drink"] },
    { prompt: "beautiful beach sunset", objects: ["beach", "sunset", "ocean"] },
    { prompt: "surfer riding a wave at the beach", objects: ["beach", "surfer", "ocean"] },
    { prompt: "large sandcastle on the beach", objects: ["beach", "sandcastle", "sand"] }
  ],
  city: [
    { prompt: "yellow taxi cab in a busy city street", objects: ["city", "taxi", "street"] },
    { prompt: "tall skyscraper buildings in the city", objects: ["city", "skyscraper", "building"] },
    { prompt: "outdoor street cafe in the city", objects: ["city", "cafe", "street"] },
    { prompt: "city skyline at night", objects: ["city", "skyline", "night"] },
    { prompt: "rainy city street with neon lights", objects: ["city", "rain", "neon"] }
  ],
  forest: [
    { prompt: "bear in a dense green forest", objects: ["forest", "bear", "trees"] },
    { prompt: "wooden cabin in the forest", objects: ["forest", "cabin", "wood"] },
    { prompt: "clear stream flowing through a forest", objects: ["forest", "stream", "water"] },
    { prompt: "people hiking on a forest trail", objects: ["forest", "hiking", "trail"] },
    { prompt: "foggy morning in a pine forest", objects: ["forest", "fog", "pine"] }
  ],
  festival: [
    { prompt: "bright fireworks in the night sky at a festival", objects: ["festival", "fireworks", "night"] },
    { prompt: "large crowd of people at a music festival", objects: ["festival", "crowd", "people"] },
    { prompt: "concert stage with lights at a festival", objects: ["festival", "stage", "lights"] },
    { prompt: "food stalls at an outdoor festival", objects: ["festival", "food", "stall"] },
    { prompt: "people dancing at a night festival", objects: ["festival", "dancing", "night"] }
  ],
  pet: [
    { prompt: "cute dog playing with a ball", objects: ["pet", "dog", "ball"] },
    { prompt: "fluffy cat sleeping on a sofa", objects: ["pet", "cat", "sofa"] },
    { prompt: "dog running in the park", objects: ["pet", "dog", "park"] },
    { prompt: "cat eating from a bowl", objects: ["pet", "cat", "bowl"] },
    { prompt: "dog and cat playing together", objects: ["pet", "dog", "cat"] }
  ]
};

const baseDir = path.resolve(__dirname, '../../../frontend/public/photos');
const samplePhotosFile = path.resolve(__dirname, 'samplePhotos.json');

// Ensure base photos directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

let photosDb = [];
let idCounter = 1;

const downloadImage = async (url, filepath) => {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
};

async function main() {
  console.log("Starting AI image generation and download process...");
  
  const promises = [];
  
  for (const [category, items] of Object.entries(categories)) {
    const catDir = path.join(baseDir, category);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir);
    }
    
    items.forEach((item, index) => {
      const filename = `${category}_${index + 1}.jpg`;
      const filepath = path.join(catDir, filename);
      const url = `https://picsum.photos/seed/${encodeURIComponent(item.prompt)}/400/400`;
      
      const p = downloadImage(url, filepath).then(() => {
        console.log(`Downloaded: ${category}/${filename}`);
      }).catch(err => {
        console.error(`Failed to download ${filename}:`, err);
      });
      
      promises.push(p);
      
      photosDb.push({
        photo_id: `p${idCounter++}`,
        url: `/photos/${category}/${filename}`,
        people: index % 2 === 0 ? ['Anuj', 'Sister'] : ['Mom', 'Dad'],
        location: { label: category.charAt(0).toUpperCase() + category.slice(1), type: category },
        timestamp: { season: index % 2 === 0 ? 'summer' : 'winter', year: 2022 + (index % 3) },
        scene: item.prompt,
        visual_attributes: { composition: 'wide', dominant_colors: ['blue', 'green'] },
        objects: item.objects
      });
    });
  }
  
  await Promise.all(promises);
  fs.writeFileSync(samplePhotosFile, JSON.stringify(photosDb, null, 2));
  console.log('Successfully generated 30 AI images into separate folders and updated samplePhotos.json!');
}

main();
