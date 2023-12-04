const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (
      req.resourceType() === 'image' ||
      req.resourceType() === 'stylesheet' ||
      req.resourceType() === 'font' ||
      req.resourceType() === 'script'
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto('https://dveri-vivaldi.ru/store/mezhkomnatnye-dveri/mezhkomnatnye-sovremennye-dveri', { waitUntil: 'networkidle2' });
    const products = await page.evaluate(() => {
      const productList = Array.from(document.querySelectorAll('.product-box__item'));
      return productList.map(product => {
        const name = product.querySelector('.product-name').innerText.trim();
        const price = product.querySelector('.price-result').innerText.trim();
        return { name, price };
      });
    });

    await browser.close();

    const csvContent = products.map(product => `${product.name},${product.price}`).join('\n');
    fs.writeFileSync('products.csv', csvContent, 'utf8');

    console.log('Data has been scraped and saved to products.csv');
  } catch (err) {
    console.error('An error occurred while scraping the data:', err);
  }
})();