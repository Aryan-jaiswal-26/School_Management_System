import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`PAGE ${msg.type().toUpperCase()}:`, msg.text());
    }
  });
  page.on('pageerror', error => console.log('PAGE UNHANDLED EXCEPTION:', error.message));

  try {
    console.log('Navigating directly to /admin...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
    
    console.log('Final URL:', page.url());
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log('Body length:', bodyHTML.length);
    if (bodyHTML.length < 500) {
      console.log('BODY HTML IS SUSPICIOUSLY SMALL:');
      console.log(bodyHTML);
    }
  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    await browser.close();
  }
})();
