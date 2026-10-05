const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/samplePhotos.json');
const photos = JSON.parse(fs.readFileSync(filePath, 'utf8'));

photos.forEach(p => {
  const scene = (p.scene || '').toLowerCase();
  const colors = [];

  if (scene.includes('sunset') || scene.includes('dusk')) {
    colors.push('orange', 'red', 'yellow');
  } else if (scene.includes('snow') || scene.includes('winter') || scene.includes('glacier') || scene.includes('ice')) {
    colors.push('white', 'light blue');
  } else if (scene.includes('beach') || scene.includes('ocean') || scene.includes('sea') || scene.includes('water')) {
    colors.push('blue', 'cyan', 'tan');
  } else if (scene.includes('mountain') || scene.includes('forest') || scene.includes('tree') || scene.includes('park') || scene.includes('grass')) {
    colors.push('green', 'brown', 'blue');
  } else if (scene.includes('office') || scene.includes('classroom') || scene.includes('meeting') || scene.includes('school')) {
    colors.push('white', 'gray', 'beige');
  } else if (scene.includes('night') || scene.includes('dark')) {
    colors.push('black', 'dark blue');
  } else {
    // default for indoor/others
    colors.push('white', 'gray');
  }

  // Deduplicate
  p.visual_attributes.dominant_colors = [...new Set(colors)];
});

fs.writeFileSync(filePath, JSON.stringify(photos, null, 2));
console.log('Fixed dominant colors for all photos.');
