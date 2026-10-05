const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5175/');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.nav-item'));
    const collectionsBtn = buttons.find(b => b.textContent.includes('Collections'));
    if (collectionsBtn) collectionsBtn.click();
  });
  
  await page.waitForSelector('.collections-view');
  await new Promise(r => setTimeout(r, 1000));
  
  const html = await page.evaluate(() => document.querySelector('.collections-view').outerHTML);
  console.log(html);
  
  await browser.close();
})();
