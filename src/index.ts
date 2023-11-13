#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { writeFile } from 'fs';

const greatLeague = 'https://pvpoke.com/rankings/all/1500/overall/';
const ultraLeague = 'https://pvpoke.com/rankings/all/2500/overall/';
const masterLeague = 'https://pvpoke.com/rankings/all/10000/overall/';
const special = [
  'shiny',
  'lucky',
  'legendary',
  'mythical',
  'special',
  'costume',
  'ultra beasts',
  '4*',
];
let $cp = '';

async function download(url: string) {
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

/**
 * Stringbuilder: add an delete strings in batch, while preventing duplicates.
 */
function stringbuilder() {
  let store = new Set<string>();
  return {
    /**
     * Insert strings as an array of strings or as multiple arguments.
     *
     * @param strings
     */
    add(string: string | string[], ...strings: string[]) {
      if (Array.isArray(string)) string.forEach((item) => store.add(item));
      if (typeof string === 'string') {
        [string, ...strings].forEach((item) => store.add(item));
      }

      return this;
    },

    /**
     * Insert pokemon (the entire evolution chain) as an array of strings or as
     * multiple arguments.
     *
     * @param strings
     */
    addPokemon(string: string | string[], ...strings: string[]) {
      if (Array.isArray(string)) {
        string.forEach((item) =>
          store.add(
            `+${item.split(' (').shift() /* Remove form an type info */}`
          )
        );
      }
      if (typeof string === 'string') {
        [string, ...strings].forEach((item) =>
          store.add(
            `+${item.split(' (').shift() /* Remove form an type info */}`
          )
        );
      }

      return this;
    },

    /**
     * Remove strings as an array of strings or as multiple arguments.
     *
     * @param strings
     */
    remove(...strings: string[]) {
      const [string] = strings;

      if (Array.isArray(string))
        return string.forEach((item) => store.delete(item));
      if (typeof string === 'string') {
        return strings.forEach((item) => store.delete(item));
      }

      return this;
    },

    /**
     * Negated added entries, the search query will locate anything BUT the added
     * query terms
     *
     * @returns this
     */
    negate() {
      store = new Set([...this.list().map((item) => `!${item}`)]);

      return this;
    },

    /**
     * Find special pokemon: `shiny`, `lucky`, `legendary`, `mythical`, `special`,
     * `costume`.
     *
     * @returns this
     */
    special() {
      this.add(special);

      return this;
    },

    /**
     * Maximize cp of the searched pokemon
     *
     * @param cp cp-500 | cp-1500 | cp-2500 | shadow | age |
     * @returns
     */
    cp(cp: 500 | 1500 | 2500) {
      $cp = `&cp-${cp}`;

      return this;
    },

    /**
     *  Maximize amount of returned pokemon
     *
     * @param amount Number of pokemon returned
     * @returns this
     */
    cap(amount: number) {
      store = new Set([...this.list().slice(0, amount /* -1? */)]);

      return this;
    },

    list() {
      return Array.from(store);
    },

    string(operator: '&' | ',') {
      return this.list().join(operator).trim() + $cp;
    },
  };
}

// Parallel is too fast, needs to be sequential
download(greatLeague)
  .then(async (great) => [great, await download(ultraLeague)])
  .then(async ([great, ultra]) => [great, ultra, await download(masterLeague)])
  .then(([great, ultra, master]) => {
    const cp1500 = stringbuilder().addPokemon(great).cap(50).list();
    const cp2500 = stringbuilder().addPokemon(ultra).cap(50).list();
    const cp10000 = stringbuilder().addPokemon(master).cap(50).list();

    writeFile(
      'src/search-strings.json',
      JSON.stringify(
        {
          greatLeague: {
            keepBest50: stringbuilder()
              .special()
              .add(cp1500)
              .negate()
              .cp(1500)
              .string('&'),
            findBest50: stringbuilder().add(cp1500).cp(1500).string(','),
          },
          ultraLeague: {
            keepBest50: stringbuilder()
              .special()
              .add(cp2500)
              .negate()
              .cp(1500)
              .string('&'),
            findBest50: stringbuilder().add(cp2500).cp(1500).string(','),
          },
          masterLeague: {
            keepBest50: stringbuilder()
              .special()
              .add(cp10000)
              .negate()
              .cp(1500)
              .string('&'),
            findBest50: stringbuilder().add(cp10000).cp(1500).string(','),
          },
          all: {
            keepBest50Overall: stringbuilder()
              .special()
              .add(cp1500)
              .add(cp2500)
              .add(cp10000)
              .negate()
              .string('&'),
            findBest50Overall: stringbuilder()
              .add(cp1500)
              .add(cp2500)
              .add(cp10000)
              .string(','),
          },
        },
        null,
        2
      ),
      (err) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log(
          "Successfully written search strings to './resources/search-strings.json'"
        );
      }
    );
  })
  .catch((error: Error) => {
    console.log('error: ', error);
  });
