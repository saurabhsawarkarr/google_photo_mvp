const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5175/');
  
  // Wait for the app to load
  await page.waitForSelector('.fab-search');
  
  // Click on the Sparkles Search FAB
  await page.click('.fab-search');
  
  // Wait for search input
  await page.waitForSelector('.search-input-wrapper');
  await new Promise(r => setTimeout(r, 1000));
  
  // Take a screenshot of the search mode
  await page.screenshot({ path: 'screenshot_search_mode.png' });
  
  // Click the filter button in the corner
  await page.evaluate(() => {
    const filterBtn = document.querySelector('.search-input-wrapper button[title="Filter options"]');
    if (filterBtn) filterBtn.click();
  });
  
  await page.waitForSelector('.refine-screen');
  await new Promise(r => setTimeout(r, 1000));
  
  // Take a screenshot of the filter screen
  await page.screenshot({ path: 'screenshot_filter_screen.png' });
  
  await browser.close();
  console.log('Screenshots saved');
})();
