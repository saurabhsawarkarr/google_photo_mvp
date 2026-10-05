const fs = require('fs');

const mappings = [
  {
    src: `C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e8b8fa94-7b6b-4d9f-92c2-3bd8e0cf8113\\mountain_bike_1791026744321.jpg`,
    dest: `h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\mountain\\mountain_1.jpg`
  },
  {
    src: `C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e8b8fa94-7b6b-4d9f-92c2-3bd8e0cf8113\\mountain_cafe_1791026761704.jpg`,
    dest: `h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\mountain\\mountain_2.jpg`
  },
  {
    src: `C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e8b8fa94-7b6b-4d9f-92c2-3bd8e0cf8113\\mountain_house_1791026808707.jpg`,
    dest: `h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\mountain\\mountain_3.jpg`
  },
  {
    src: `C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e8b8fa94-7b6b-4d9f-92c2-3bd8e0cf8113\\mountain_person_1791026823298.jpg`,
    dest: `h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\mountain\\mountain_4.jpg`
  },
  {
    src: `C:\\Users\\pc\\.gemini\\antigravity-ide\\brain\\e8b8fa94-7b6b-4d9f-92c2-3bd8e0cf8113\\mountain_landscape_1791026838654.jpg`,
    dest: `h:\\Antigravity\\Google Photo MVP\\frontend\\public\\photos\\mountain\\mountain_5.jpg`
  }
];

mappings.forEach(m => {
  fs.copyFileSync(m.src, m.dest);
  console.log(`Copied to ${m.dest}`);
});
