const fs = require('fs');
const path = './src/data/samplePhotos.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Clear all people arrays first
data.forEach(photo => {
    photo.people = [];
});

const tagMap = {
    '/photos/sports/sports_1.jpg': ['Amit'],         // Boys
    '/photos/sports/sports_2.jpg': ['Priya'],        // Girl
    '/photos/school/school_3.jpg': ['Rahul'],        // Children
    '/photos/sports/sports_4.jpg': ['Sneha'],        // Women
    '/photos/beach/beach_4.jpg': ['Vikram'],         // Men
    '/photos/office/office_1.jpg': ['Priya'],        // People working
    '/photos/office/office_2.jpg': ['Amit'],         // Business meeting
    '/photos/office/office_4.jpg': ['Vikram'],       // Employees chatting
    '/photos/school/school_1.jpg': ['Sneha'],        // Students sitting
    '/photos/sports/sports_3.jpg': ['Rahul'],        // Child playing soccer
    '/photos/office/office_5.jpg': ['Amit'],         // Creative team
    '/photos/sports/sports_5.jpg': ['Vikram']        // People working out
};

data.forEach(photo => {
    if (tagMap[photo.url]) {
        photo.people = tagMap[photo.url];
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Manually assigned names properly');
