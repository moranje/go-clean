#!/usr/bin/env node

import figlet from 'figlet';
import { Command } from 'commander';
import ora from 'ora';
import kleur from 'kleur';
import { writeFile } from 'fs';
import { download } from './lib/download.js';
import { all, league } from './lib/groupbuilder.js';
const program = new Command();

const greatLeague = 'https://pvpoke.com/rankings/all/1500/overall/';
const ultraLeague = 'https://pvpoke.com/rankings/all/2500/overall/';
const masterLeague = 'https://pvpoke.com/rankings/all/10000/overall/';

console.log(figlet.textSync(`Go clean!`));

program
  .version('1.0.0')
  .description('Your storage is full of messy pokémon, go clean!')
  .option('-o, --out <target>', 'A path for JSON output', 'search-strings.json')
  .parse(process.argv);

const options = program.opts();

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

    // TODO location as arg
    writeFile(
      options.out,
      JSON.stringify(
        {
          greatLeague: league(great, 1500, [10, 50, 100]),
          ultraLeague: league(ultra, 2500, [10, 50, 100]),
          masterLeague: league(master, null, [10, 50, 100]),
          all: all(great, ultra, master, [10, 50, 100]),
        },
        null,
        2
      ),
      (err) => {
        if (err) {
          spinner.fail(err.message);
          process.exit(1);
        }

        spinner.succeed(
          `Successfully written search strings to ${kleur
            .blue()
            .underline(options.out)}`
        );
        process.exit(0);
      }
    );
  })
  .catch((error: Error) => {
    spinner.fail(error.message);
    process.exit(1);
  });
