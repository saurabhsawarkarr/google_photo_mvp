const fs = require('fs');
const path = require('path');

const categories = {
  mountain: [
    { prompt: "A mountain bike parked on an alpine trail overlooking a valley and snow-capped peaks", objects: ["mountain", "bicycle", "mountain bike", "trail", "alps", "nature", "valley", "summer", "sports", "outdoors", "greenery", "clouds", "scenic", "adventure"] },
    { prompt: "Tourists dining outside a cozy rustic mountain chalet with huge mountains and a glacier behind it", objects: ["mountain", "cafe", "chalet", "restaurant", "people", "tourists", "dining", "outdoor seating", "food", "vacation", "holiday", "snow", "glacier", "alps", "pine trees", "relaxing", "summer"] },
    { prompt: "A wooden cabin by a serene blue alpine lake, surrounded by pine trees, wildflowers, and mountains", objects: ["mountain", "cabin", "house", "lake", "water", "pine trees", "forest", "nature", "wildflowers", "path", "peaceful", "serene", "remote", "summer", "greenery"] },
    { prompt: "A hiker with a backpack standing on a ridge, looking out at a stunning panoramic view of jagged snow-capped mountains", objects: ["mountain", "person", "hiker", "backpack", "standing", "view", "ridge", "path", "hiking", "trekking", "adventure", "panoramic", "majestic", "alps", "valley", "outdoors"] },
    { prompt: "A vast snow-covered mountain landscape with a solitary figure trekking through deep snow", objects: ["mountain", "snow", "winter", "landscape", "walking", "person", "trekking", "cold", "footprints", "expedition", "solitude", "ice", "peaks", "alpine", "frozen", "nature"] }
  ],
  beach: [
    { prompt: "Man standing on the beach looking out at the ocean", objects: ["beach", "man", "person", "standing", "ocean", "hat", "blue shirt", "summer", "vacation", "looking away", "horizon", "blue sky", "sunny", "coast", "shoreline"] },
    { prompt: "Scenic empty beach with crashing waves and a palm tree-covered cliff in the distance", objects: ["beach", "waves", "ocean", "sand", "cliff", "palm trees", "nature", "landscape", "scenic", "peaceful", "surf", "coastline", "summer", "travel", "destination"] },
    { prompt: "Tropical white sand beach with leaning palm trees and clear blue water", objects: ["beach", "tropical", "palm trees", "white sand", "ocean", "clear water", "nature", "paradise", "island", "resort", "vacation", "holiday", "relaxing", "summer", "sunshine", "exotic", "turquoise"] },
    { prompt: "Men playing a competitive game of beach volleyball on the sand", objects: ["beach", "volleyball", "sports", "people", "playing", "sand", "net", "ball", "summer", "active", "fitness", "team", "match", "jumping", "athletic", "outdoor", "recreation"] },
    { prompt: "Silhouettes of an adult and child riding bicycles on the beach at sunset", objects: ["beach", "sunset", "silhouette", "bicycles", "riding", "people", "parent", "child", "evening", "dusk", "golden hour", "family", "bonding", "active", "leisure", "cycling", "coast"] }
  ],
  school: [
    { prompt: "Students sitting at desks in a bright classroom", objects: ["school", "classroom", "students", "desks", "studying", "education", "learning", "bright", "teacher"] },
    { prompt: "Yellow school bus parked in front of a brick school building", objects: ["school", "bus", "yellow bus", "brick building", "education", "transportation", "trees", "fall"] },
    { prompt: "Children playing on a school playground during recess", objects: ["school", "playground", "children", "kids", "playing", "recess", "slide", "fun", "outdoors"] },
    { prompt: "Teacher writing on a chalkboard in front of students", objects: ["school", "teacher", "chalkboard", "writing", "students", "learning", "classroom", "education", "chemistry", "science"] },
    { prompt: "Students walking down a school hallway with lockers", objects: ["school", "hallway", "lockers", "students", "walking", "teenagers", "backpacks", "high school", "friends"] }
  ],
  office: [
    { prompt: "Modern open plan office with people working at computers", objects: ["office", "working", "open plan", "computers", "desks", "colleagues", "technology", "business", "modern"] },
    { prompt: "Business meeting in a glass conference room", objects: ["office", "meeting", "conference room", "glass", "business", "presentation", "colleagues", "corporate", "teamwork"] },
    { prompt: "Empty office desk with a laptop, coffee cup, and notebook", objects: ["office", "desk", "empty desk", "laptop", "coffee cup", "notebook", "workspace", "productivity", "work from home"] },
    { prompt: "A bright office breakroom with employees chatting over coffee", objects: ["office", "breakroom", "coffee", "chatting", "employees", "coworkers", "relaxing", "kitchen", "modern"] },
    { prompt: "A creative team brainstorming at a white board in a colorful office", objects: ["office", "brainstorming", "whiteboard", "creative", "team", "startup", "colorful", "working", "planning"] }
  ],
  sports: [
    { prompt: "Boys playing street cricket with a bat and red ball", objects: ["cricket", "boys", "playing", "street cricket", "dusty field", "bat", "red ball", "bricks", "wicket", "sports", "outdoor", "daytime"] },
    { prompt: "Girl batting while playing cricket on a dusty field", objects: ["cricket", "girl", "batting", "tennis ball", "spectators", "sports", "outdoor", "field", "daytime", "active", "blue shirt", "red pants"] },
    { prompt: "Child playing soccer and kicking a ball on a grass field", objects: ["soccer", "football", "child", "kicking", "ball", "grass field", "outdoor", "sports", "blue sky", "active", "playing"] },
    { prompt: "Women running and jogging on a path in a green park", objects: ["running", "jogging", "women", "park", "trees", "fitness", "exercise", "sports", "outdoor", "smartwatch", "activewear", "health"] },
    { prompt: "People working out in a gym with kettlebell and battle ropes", objects: ["gym", "workout", "fitness", "squats", "kettlebell", "battle ropes", "bear crawl", "turf", "exercise", "sports", "indoor", "training", "strength"] }
  ]
};

let photosDb = [];
let idCounter = 1;

for (const [category, items] of Object.entries(categories)) {
  items.forEach((item, index) => {
    const filename = `${category}_${index + 1}.jpg`;
    photosDb.push({
      photo_id: `p${idCounter++}`,
      url: `/photos/${category}/${filename}`,
      people: index % 2 === 0 ? ['Anuj', 'Sister'] : ['Mom', 'Dad'],
      location: { label: category.charAt(0).toUpperCase() + category.slice(1), type: category },
      timestamp: { season: index % 2 === 0 ? 'summer' : 'winter', year: 2022 + (index % 3) },
      scene: item.prompt,
      visual_attributes: { composition: 'wide', dominant_colors: ['blue', 'green'] },
      objects: item.objects
    });
  });
}
// Shuffle the photos array so they are mixed instead of ordered by category
for (let i = photosDb.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [photosDb[i], photosDb[j]] = [photosDb[j], photosDb[i]];
}

const samplePhotosFile = path.resolve(__dirname, 'samplePhotos.json');
fs.writeFileSync(samplePhotosFile, JSON.stringify(photosDb, null, 2));
console.log('samplePhotos.json updated (shuffled)!');
