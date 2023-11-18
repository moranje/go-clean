#!/usr/bin/env node

import figlet from 'figlet';
import { Command } from 'commander';
import ora from 'ora';
import kleur from 'kleur';
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { download } from './lib/download.js';
import { all, build } from './lib/groupbuilder.js';
import stringbuilder from './lib/stringbuilder.js';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const program = new Command();
const league = {
  great: 'https://pvpoke.com/rankings/all/1500/overall/',
  ultra: 'https://pvpoke.com/rankings/all/2500/overall/',
  master: 'https://pvpoke.com/rankings/all/10000/overall/',
};

console.log(figlet.textSync(`GO CLEAN`));

const spinner = ora({
  text: `Finding latest rankings on ${kleur.blue().bold('PvPoke.com')}`,
  spinner: 'simpleDotsScrolling',
}).start();

program
  .name('go-clean')
  .version(pkg.version)
  .description("Download search strings based on PvPoke's rankings");
// .enablePositionalOptions();

program
  .command('file')
  .description('Store rankings in a json file')
  .option('-o, --out <target>', 'A path for JSON output', 'search-strings.json')
  .action((options) => {
    download(league.great)
      .then(async (great) => {
        spinner.text = 'Great league rankings downloaded';
        return [great, await download(league.ultra)];
      })
      .then(async ([great, ultra]) => {
        spinner.text = 'Ultra league rankings downloaded';
        return [great, ultra, await download(league.master)];
      })
      .then(([great, ultra, master]) => {
        spinner.text = 'Master league rankings downloaded';

        return writeFile(
          options.out,
          JSON.stringify(
            {
              greatLeague: build(great, 1500, [10, 50, 100]),
              ultraLeague: build(ultra, 2500, [10, 50, 100]),
              masterLeague: build(master, null, [10, 50, 100]),
              all: all(great, ultra, master, [10, 50, 100]),
            },
            null,
            2
          )
        );
      })
      .then(() => {
        spinner.succeed(
          `Successfully written search strings to ${kleur
            .blue()
            .underline(options.out)}`
        );
        process.exit(0);
      })
      .catch((error: Error) => {
        spinner.fail(error.message);
        process.exit(1);
      });
  });

program
  .command('search')
  .description("Create a search string based on PvPoke's rankings")
  .requiredOption(
    '-l,  --league <name>',
    'Great, ultra or master leaque (required)'
  )
  .option('-s,  --size <number>', 'The size of the pokemon list', '50')
  .option('-sp, --special', 'Include special', false)
  .option('-c,  --cp <number>', 'Maximize by by CP')
  .option('-hd, --hide', 'Hide selected pokemon from search', false)
  .helpOption('-h,  --help', 'Display help for command')
  .action((options) => {
    spinner.text = `Looking up ${options.league} league rankings`;

    download(
      league[options.league.toLowerCase() as 'great' | 'ultra' | 'master']
    )
      .then((rankings) => {
        spinner.succeed(
          `Got it! Use this to select pokemon:\n\n${kleur.blue().underline(
            stringbuilder()
              .add(rankings)
              .cap(+options.size)
              .special()
              .negate(!options.hide)
              .cp(options.cp)
              .string(options.hide ? ',' : '&')
          )}`
        );
        process.exit(0);
      })
      .catch((error: Error) => {
        spinner.fail(error.message);
        process.exit(1);
      });
  });

program.parse(process.argv);
