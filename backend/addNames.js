const fs = require('fs');
const path = './src/data/samplePhotos.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'];
data.forEach((photo, index) => {
    photo.people = [names[index % 5]];
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Done modifying samplePhotos.json');
