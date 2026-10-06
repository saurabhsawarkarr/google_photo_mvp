const fs = require('fs');
const path = require('path');
const https = require('https');

const brainDir = "C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\b5e101df-2dee-44db-94b8-6d67cf6b93b8";
const publicPhotosDir = "H:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos";

// 1. Delete unwanted folders
const unwanted = ['forest', 'festival', 'pet', 'city'];
unwanted.forEach(folder => {
  const p = path.join(publicPhotosDir, folder);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
});

// 2. Setup school
const schoolDir = path.join(publicPhotosDir, 'school');
if (fs.existsSync(schoolDir)) fs.rmSync(schoolDir, { recursive: true, force: true });
fs.mkdirSync(schoolDir, { recursive: true });
fs.copyFileSync(path.join(brainDir, 'school_1_1791029001328.jpg'), path.join(schoolDir, 'school_1.jpg'));
fs.copyFileSync(path.join(brainDir, 'school_2_1791029017306.jpg'), path.join(schoolDir, 'school_2.jpg'));
fs.copyFileSync(path.join(brainDir, 'school_3_1791029031724.jpg'), path.join(schoolDir, 'school_3.jpg'));
fs.copyFileSync(path.join(brainDir, 'school_4_1791029048953.jpg'), path.join(schoolDir, 'school_4.jpg'));
fs.copyFileSync(path.join(brainDir, 'school_5_1791029066361.jpg'), path.join(schoolDir, 'school_5.jpg'));

// 3. Setup office
const officeDir = path.join(publicPhotosDir, 'office');
if (fs.existsSync(officeDir)) fs.rmSync(officeDir, { recursive: true, force: true });
fs.mkdirSync(officeDir, { recursive: true });
fs.copyFileSync(path.join(brainDir, 'office_1_1791029262332.jpg'), path.join(officeDir, 'office_1.jpg'));
fs.copyFileSync(path.join(brainDir, 'office_2_1791029276668.jpg'), path.join(officeDir, 'office_2.jpg'));
fs.copyFileSync(path.join(brainDir, 'office_3_1791029289796.jpg'), path.join(officeDir, 'office_3.jpg'));
fs.copyFileSync(path.join(brainDir, 'office_1_1791029262332.jpg'), path.join(officeDir, 'office_4.jpg'));
fs.copyFileSync(path.join(brainDir, 'office_2_1791029276668.jpg'), path.join(officeDir, 'office_5.jpg'));

// 4. Setup sports
const sportsDir = path.join(publicPhotosDir, 'sports');
if (fs.existsSync(sportsDir)) fs.rmSync(sportsDir, { recursive: true, force: true });
fs.mkdirSync(sportsDir, { recursive: true });

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
    }).on('error', reject);
  });
};

async function setupSports() {
  await downloadImage("https://picsum.photos/seed/sports1/800/600", path.join(sportsDir, 'sports_1.jpg'));
  await downloadImage("https://picsum.photos/seed/sports2/800/600", path.join(sportsDir, 'sports_2.jpg'));
  await downloadImage("https://picsum.photos/seed/sports3/800/600", path.join(sportsDir, 'sports_3.jpg'));
  await downloadImage("https://picsum.photos/seed/sports4/800/600", path.join(sportsDir, 'sports_4.jpg'));
  await downloadImage("https://picsum.photos/seed/sports5/800/600", path.join(sportsDir, 'sports_5.jpg'));
  console.log("All done!");
}
setupSports();
