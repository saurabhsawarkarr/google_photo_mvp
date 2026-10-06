const fs = require('fs');
const https = require('https');
const path = require('path');

const sportsUrls = [
  "https://upload.wikimedia.org/wikipedia/commons/4/42/Football_in_Bloomington%2C_Indiana%2C_1995.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/d/dc/Small_group_fitness_sessions_bundall.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7a/Track_and_field_stadium.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/2/26/USA_vs._China_Mens_Basketball_-_Beijing_2008_Olympic_Games_%282751923597%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/4/4a/Depart4x100.jpg"
];

const sportsDir = path.join(__dirname, 'frontend/public/photos/sports');
if (!fs.existsSync(sportsDir)) fs.mkdirSync(sportsDir, { recursive: true });

sportsUrls.forEach((url, i) => {
  const file = fs.createWriteStream(path.join(sportsDir, `sports_${i+1}.jpg`));
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, response => {
    response.pipe(file);
    file.on('finish', () => file.close());
  }).on('error', err => fs.unlink(path.join(sportsDir, `sports_${i+1}.jpg`)));
});

// Copy office images to fill out 5
const officeDir = path.join(__dirname, 'frontend/public/photos/office');
if (fs.existsSync(path.join(officeDir, 'office_1.jpg'))) {
  fs.copyFileSync(path.join(officeDir, 'office_1.jpg'), path.join(officeDir, 'office_4.jpg'));
  fs.copyFileSync(path.join(officeDir, 'office_2.jpg'), path.join(officeDir, 'office_5.jpg'));
}
console.log("Downloading sports images and duplicating office images...");
