import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

export async function download(url: string) {
  let cache: { [key: string]: { data: any; timestamp: number } } = {};
  try {
    cache = JSON.parse((await readFile('./.cache', 'utf8')) || '{}');
  } catch {}

  // Read from cache
  if (
    cache[url] &&
    Date.now() - cache[url].timestamp <
      /* 1 week in ms */ 7 * 24 * 60 * 60 * 1000
  ) {
    return cache[url].data;
  }

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

    // Create cache
    cache[url] = { data: rankings, timestamp: Date.now() };
    await writeFile('./.cache', JSON.stringify(cache));

    return rankings;
  } catch (error) {
    console.log('error: ', error);
    throw error;
  } finally {
    await browser?.close();
  }
}
