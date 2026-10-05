const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  page.on('response', response => {
    if (response.url().includes('search')) {
      console.log('SEARCH RESPONSE STATUS:', response.status());
    }
  });
  
  await page.goto('http://localhost:5175/');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
