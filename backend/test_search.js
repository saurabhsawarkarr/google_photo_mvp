const { searchPhotos } = require('./src/services/searchService');

const clues = [
  { dimension: 'location', value: 'beach', active: true },
  { dimension: 'person', value: 'vikram', active: true },
  { dimension: 'visual', value: 'wide', active: true },
  { dimension: 'activity', value: 'riding', active: true }
];

const res = searchPhotos(clues);
console.log("Photos count:", res.photos.length);
console.log("Relaxed count:", res.relaxed_photos.length);
