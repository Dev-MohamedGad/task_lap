import puppeteer from 'puppeteer'
async function scrapeTwitter(accounts, tickerSymbols, interval) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = {};

  // Loop through each account and scrape the tweets
  for (let account of accounts) {
    console.log(`Scraping ${account} for stock symbols...`);

    // Go to the Twitter account page
    await page.goto(account, { waitUntil: 'networkidle2' });

    // Scroll down the page to load more tweets
    await autoScroll(page);

    // Get the tweets' content
    const tweets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('article')).map(tweet => tweet.innerText);
    });

    // Count mentions of each ticker symbol
    tickerSymbols.forEach(symbol => {
      const regex = new RegExp(`\\${symbol}`, 'g');
      const mentions = tweets.reduce((acc, tweet) => acc + (tweet.match(regex) || []).length, 0);
      if (mentions > 0) {
        if (!results[symbol]) {
          results[symbol] = [];
        }
        results[symbol].push({
          account,
          mentions
        });
      }
    });
  }

  await browser.close();

  // Display the results
  console.log("\n--- Scraping Results ---");
  for (let symbol in results) {
    console.log(`\nSymbol: ${symbol}`);
    results[symbol].forEach(result => {
      console.log(`"${symbol}" was mentioned "${result.mentions}" times by "${result.account}"`);
    });
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

const twitterAccounts = [
  'https://twitter.com/warrior_0719',
  'https://twitter.com/allstarcharts',
  'https://twitter.com/yuriymatso',
  'https://twitter.com/TriggerTrades',
  'https://twitter.com/AdamMancini4',
  'https://twitter.com/CordovaTrades',
  'https://twitter.com/Barchart',
  'https://twitter.com/RoyLMattox',
  'https://twitter.com/Mr_Derivatives'
];
const tickerSymbols = [ '$MSFT','$TSLA', '$AAPL']; 
const interval = 1;

setInterval(() => {
  scrapeTwitter(twitterAccounts, tickerSymbols, interval);
}, interval * 30 * 1000);
