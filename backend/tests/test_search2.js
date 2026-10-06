const { searchPhotos } = require('../src/services/searchService');

const clues = [
  { dimension: 'location', value: 'Beach', active: true },
  { dimension: 'person', value: 'Vikram', active: true },
  { dimension: 'visual', value: 'Wide', active: true },
  { dimension: 'activity', value: 'Riding', active: true }
];

const res = searchPhotos(clues);
console.log("Photos count:", res.photos.length);
console.log("Relaxed count:", res.relaxed_photos.length);
