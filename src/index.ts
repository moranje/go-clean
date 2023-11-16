#!/usr/bin/env node

import ora from 'ora';
import figlet from 'figlet';
import kleur from 'kleur';
import { writeFile } from 'fs';
import { download } from './lib/download.js';
import stringbuilder from './lib/stringbuilder.js';

const greatLeague = 'https://pvpoke.com/rankings/all/1500/overall/';
const ultraLeague = 'https://pvpoke.com/rankings/all/2500/overall/';
const masterLeague = 'https://pvpoke.com/rankings/all/10000/overall/';

console.log(figlet.textSync('Go clean!'));
const spinner = ora({
  text: `Finding latest rankings on ${kleur.blue().bold('PvPoke.com')}`,
  spinner: 'simpleDotsScrolling',
}).start();

// Parallel is too fast, needs to be sequential
download(greatLeague)
  .then(async (great) => {
    spinner.text = 'Great league rankings downloaded';
    return [great, await download(ultraLeague)];
  })
  .then(async ([great, ultra]) => {
    spinner.text = 'Ultra league rankings downloaded';
    return [great, ultra, await download(masterLeague)];
  })
  .then(([great, ultra, master]) => {
    spinner.text = 'Master league rankings downloaded';
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
              .cp(2500)
              .string('&'),
            findBest50: stringbuilder().add(cp2500).cp(2500).string(','),
          },
          masterLeague: {
            keepBest50: stringbuilder()
              .special()
              .add(cp10000)
              .negate()
              .string('&'),
            findBest50: stringbuilder().add(cp10000).string(','),
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
          spinner.fail(err.message);
          return;
        }

        spinner.succeed(
          `Successfully written search strings to ${kleur
            .blue()
            .underline('./resources/search-strings.json')}`
        );
      }
    );
  })
  .catch((error: Error) => {
    spinner.fail(error.message);
  });
