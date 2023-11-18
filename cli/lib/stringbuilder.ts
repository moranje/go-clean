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

/**
 * Stringbuilder: add an delete strings in batch, while preventing duplicates.
 */
export default function stringbuilder() {
  let store = new Set<string>();
  let $cp = '';
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
    negate(ignore?: boolean) {
      if (ignore === true) return this;

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
     * @param cp 1500 | 2500
     * @returns
     */
    cp(cp: 1500 | 2500 | null) {
      if (!cp) return this;

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
