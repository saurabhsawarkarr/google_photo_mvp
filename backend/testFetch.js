const fs = require('fs');

async function test() {
  const res = await fetch("https://image.pollinations.ai/prompt/mountain%20bike?width=400&height=400&nologo=true", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });
  const buffer = await res.arrayBuffer();
  fs.writeFileSync("test_image.jpg", Buffer.from(buffer));
  console.log("Size:", buffer.byteLength);
}
test();
