const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5175/');
  
  // Wait for the app to load
  await page.waitForSelector('.bottom-nav');
  
  // Evaluate click on Collections button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.nav-item'));
    const collectionsBtn = buttons.find(b => b.textContent.includes('Collections'));
    if (collectionsBtn) collectionsBtn.click();
  });
  
  // Wait for the collections view
  await page.waitForSelector('.collections-view');
  
  // Wait a bit to ensure rendering
  await new Promise(r => setTimeout(r, 2000));
  
  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
  console.log('Screenshot saved to screenshot.png');
})();
