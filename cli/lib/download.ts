import puppeteer from 'puppeteer';

export async function download(url: string) {
  let browser;
  try {
    // Launch the browser and open a new blank page
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto(url);

    // Wait for results to load
    await page.waitForSelector('.score-rating', {
      timeout: 10_000,
    });

    let rankings: string[] = [];
    try {
      rankings = await page.$eval('.rankings-container', (rankings) => {
        return [...rankings.childNodes].map((rank) => {
          return (
            rank.childNodes[1 /* .name-container */].childNodes[1 /* .name */]
              .childNodes[0 /* text */].textContent || ''
          );
        });
      });

      if (rankings.length === 0) throw new Error("This shouln't be empty");
    } catch (error) {
      throw new Error(
        'Scraping PVPoke returned no rankings, it is likely that the sites markup has changed enough to break the scraper.'
      );
    }

    return rankings;
  } catch (error) {
    console.log('error: ', error);
    throw error;
  } finally {
    await browser?.close();
  }
}
