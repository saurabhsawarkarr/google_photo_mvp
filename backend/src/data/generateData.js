const fs = require('fs');
const path = require('path');

const categories = ['beach', 'sunset', 'flower', 'mountain', 'city'];

const locations = {
  beach: ['Goa', 'Maldives', 'Bali', 'Miami', 'Hawaii'],
  sunset: ['Home', 'Marine Drive', 'Grand Canyon', 'Santorini', 'Malibu'],
  flower: ['Farm', 'Botanical Garden', 'Park', 'Backyard', 'Keukenhof'],
  mountain: ['Manali', 'Swiss Alps', 'Himalayas', 'Rockies', 'Andes'],
  city: ['New York', 'Tokyo', 'London', 'Mumbai', 'Paris']
};

let photos = [];
let idCounter = 1;

categories.forEach(category => {
  for (let index = 0; index < 5; index++) {
    // Generate a unique seed for picsum to ensure unique images that always load
    const seed = `${category}_${index}_${Date.now()}`;
    photos.push({
      photo_id: `p${idCounter++}`,
      // Use picsum.photos for guaranteed 100% uptime and no hotlinking issues
      url: `https://picsum.photos/seed/${seed}/400/400`,
      people: index % 2 === 0 ? ['Anuj', 'Sister'] : ['Mom', 'Dad'],
      location: { label: locations[category][index], type: category },
      timestamp: { season: index % 2 === 0 ? 'summer' : 'winter', year: 2020 + index },
      scene: category === 'beach' ? 'vacation' : category === 'sunset' ? 'evening' : 'outdoor',
      visual_attributes: { composition: 'wide', dominant_colors: ['blue', 'green'] },
      objects: [category, 'sky', 'nature']
    });
  }
});

fs.writeFileSync(path.join(__dirname, 'samplePhotos.json'), JSON.stringify(photos, null, 2));
console.log('samplePhotos.json regenerated with 100% reliable picsum URLs!');
