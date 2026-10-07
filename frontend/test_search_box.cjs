const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  console.log("Page loaded");
  await new Promise(r => setTimeout(r, 2000));
  
  // Click the search FAB to open the search UI
  await page.waitForSelector('.fab-search', { timeout: 5000 });
  await page.click('.fab-search');
  await new Promise(r => setTimeout(r, 1000));
  
  // Find the search box and type "blue shirt"
  await page.waitForSelector('input[type="text"]', { timeout: 5000 }).catch(e => console.log("Search input not found: ", e));
  
  try {
    const input = await page.$('input[type="text"]');
    if (input) {
      await input.type('blue shirt');
      console.log("Typed 'blue shirt'");
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: 'search_blue_shirt_initial.png' });
      console.log("Saved screenshot: search_blue_shirt_initial.png");
      const text = await page.evaluate(() => document.body.innerText);
      console.log("Body text after search:", text.substring(0, 500));
    } else {
      console.log("No input found");
    }
  } catch (e) {
    console.log("Error during blue shirt search:", e);
  }

  await browser.close();
})();
