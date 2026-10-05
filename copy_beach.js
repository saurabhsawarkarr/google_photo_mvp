const fs = require('fs');
const path = require('path');

const srcDir = 'h:\\Antigravity\\Google Photo MVP\\Document\\Images\\Beach';
const destDir = 'h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\beach';

const files = [
  'images.jpg',
  'images (1).jpg',
  'images (2).jpg',
  'images (3).jpg',
  'images (4).jpg'
];

files.forEach((file, idx) => {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, `beach_${idx + 1}.jpg`));
});
console.log("Images copied");
