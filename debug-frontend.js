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
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('Navigating to /login...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
    
    console.log('Typing credentials...');
    await page.type('#login-email', 'admin@school.com');
    await page.type('#login-password', '123');
    
    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => console.log('Navigation timeout after login, proceeding anyway...'))
    ]);
    
    const url = page.url();
    console.log('Current URL after login:', url);
    
    if (!url.includes('/admin')) {
      console.log('Navigating to /admin explicitly...');
      await page.goto('http://localhost:5174/admin', { waitUntil: 'networkidle0' });
    }
    
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
