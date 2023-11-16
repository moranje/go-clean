import stringbuilder from './stringbuilder.js';

/**
 * A sample of the top pokemon from all leagues.
 *
 * @param great Great league rankings.
 * @param ultra Ultra league rankings.
 * @param master Master league rankings.
 * @param caps The amount of pokemon included per league
 * @returns
 */
export function all(
  great: string[],
  ultra: string[],
  master: string[],
  caps: number[]
) {
  let strings: { [key: string]: string } = {};
  caps.forEach((cap) => {
    const greatList = stringbuilder().addPokemon(great).cap(cap).list();
    const ultraList = stringbuilder().addPokemon(ultra).cap(cap).list();
    const masterList = stringbuilder().addPokemon(master).cap(cap).list();

    strings[`hideBest${cap}Overall`] = stringbuilder()
      .special()
      .add(greatList)
      .add(ultraList)
      .add(masterList)
      .negate()
      .string('&');
    strings[`findBest${cap}Overall`] = stringbuilder()
      .add(greatList)
      .add(ultraList)
      .add(masterList)
      .string(',');
  });

  return strings;
}

/**
 * Get search strings to hide or find the top pokemon of a given league.
 *
 * @param rankings A list of pokemon names.
 * @param cp The CP to maximize the search by
 * @param caps The amount of pokemon included
 * @returns
 */
export function league(
  rankings: string[],
  cp: 1500 | 2500 | null,
  caps: number[]
) {
  let strings: { [key: string]: string } = {};
  caps.forEach((cap) => {
    const list = stringbuilder().addPokemon(rankings).cap(cap).list();

    strings[`hideBest${cap}`] = stringbuilder()
      .special()
      .add(list)
      .negate()
      .cp(cp)
      .string('&');
    strings[`findBest${cap}`] = stringbuilder().add(list).cp(cp).string(',');
  });

  return strings;
}
