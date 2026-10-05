const fs = require('fs');
const path = './src/data/samplePhotos.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const humanWords = ['person', 'boy', 'girl', 'man', 'woman', 'people', 'child', 'children', 'tourist', 'tourists', 'figure'];
const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram'];

let humanIndex = 0;

data.forEach((photo) => {
    const hasHuman = humanWords.some(w => photo.scene.toLowerCase().includes(w) || photo.objects.includes(w));
    if (hasHuman) {
        photo.people = [names[humanIndex % 5]];
        humanIndex++;
    } else {
        photo.people = [];
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Done properly modifying samplePhotos.json');
