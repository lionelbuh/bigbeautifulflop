/**
 * Regional editions. Adding a region = adding one entry here, then writing its versions
 * in content/statements/*.json under `editions.<id>`. Pages, navigation, sitemap and the
 * daily rotation pick it up automatically.
 *
 * `chip` holds two colours shown as a small swatch next to the label. They are the canton's
 * colours as a plain swatch, not its flag or coat of arms.
 */
export const COUNTRIES = [
  {
    id: 'switzerland',
    name: 'Switzerland',
    native: 'Suisse romande',
    path: '/switzerland/',
    lang: 'fr-CH',
    flag: 'ch',
    description:
      'The same statement, retold the way people actually talk in French-speaking Switzerland: understatement, local pride and a glass of something within reach.',
  },
  {
    id: 'france',
    name: 'France',
    native: 'France',
    path: '/france/',
    lang: 'fr-FR',
    flag: 'fr',
    description:
      'From the Paris terrace to the Marseille pétanque court: the statement adapted to the moods and expressions of France’s regions.',
  },
];

export const REGIONS = [
  // Switzerland: French-speaking cantons
  {
    id: 'vaudois',
    country: 'switzerland',
    name: 'Vaudois',
    place: 'Vaud: Morges, Lausanne, Yverdon',
    lang: 'fr-CH',
    chip: ['#ffffff', '#2f8f4e'],
    voice: 'Never says yes or no when “faut voir” will do. Understatement is a sport; enthusiasm is suspicious.',
  },
  {
    id: 'valaisan',
    country: 'switzerland',
    name: 'Valaisan',
    place: 'Valais: Sion, Martigny, Sierre',
    lang: 'fr-CH',
    chip: ['#ffffff', '#d52b1e'],
    voice: 'Says “Adieu” to say hello. Proud, mountain-hard, convinced the rest of Switzerland lives “en bas”.',
  },
  {
    id: 'genevois',
    country: 'switzerland',
    name: 'Genevois',
    place: 'Geneva',
    lang: 'fr-CH',
    chip: ['#f2c200', '#d52b1e'],
    voice: 'Has seen every head of state on earth drive past in a motorcade. Is impressed by none of them.',
  },
  {
    id: 'fribourgeois',
    country: 'switzerland',
    name: 'Fribourgeois',
    place: 'Fribourg, La Gruyère',
    lang: 'fr-CH',
    chip: ['#1c1b19', '#ffffff'],
    voice: 'Lives astride the language border, measures the year in Bénichons and settles every debate over a moitié-moitié.',
  },
  {
    id: 'neuchatelois',
    country: 'switzerland',
    name: 'Neuchâtelois',
    place: 'Neuchâtel, La Chaux-de-Fonds',
    lang: 'fr-CH',
    chip: ['#2f8f4e', '#d52b1e'],
    voice: 'Makes watches with three hundred parts. Still argues about whether things belong “en haut” or “en bas”.',
  },
  // France
  {
    id: 'parisien',
    country: 'france',
    name: 'Parisien',
    place: 'Paris',
    lang: 'fr-FR',
    chip: ['#1f3a5f', '#b3121a'],
    voice: 'Urban, direct, sarcastic, in a hurry. Will complain about the métro and the waiter in the same sentence.',
  },
  {
    id: 'sud',
    country: 'france',
    name: 'Sud de la France',
    place: 'Marseille, Provence',
    lang: 'fr-FR',
    chip: ['#f2c200', '#b3121a'],
    voice: 'Never exaggerates, except all the time. The sardine really did block the port of Marseille.',
  },
  {
    id: 'chti',
    country: 'france',
    name: 'Ch’ti',
    place: 'Nord: Lille, Valenciennes',
    lang: 'fr-FR',
    chip: ['#f2c200', '#1c1b19'],
    voice: 'Warm, teasing, endlessly hospitable. Rain is “la drache” and everybody is “biloute”.',
  },
  {
    id: 'lyonnais',
    country: 'france',
    name: 'Lyonnais',
    place: 'Lyon',
    lang: 'fr-FR',
    chip: ['#b3121a', '#ffffff'],
    voice: 'Calls everyone “gone”, solves problems in a bouchon and measures wine by the 46-centilitre pot.',
  },
  {
    id: 'breton',
    country: 'france',
    name: 'Breton',
    place: 'Brittany',
    lang: 'fr-FR',
    chip: ['#1c1b19', '#ffffff'],
    voice: 'Understated, stubborn, unbothered by weather. Salted butter is not a preference, it is a position.',
  },
];

export function getRegion(id) {
  return REGIONS.find((r) => r.id === id);
}

export function getCountry(id) {
  return COUNTRIES.find((c) => c.id === id);
}

export function regionsOf(countryId) {
  return REGIONS.filter((r) => r.country === countryId);
}

export function regionPath(region) {
  return `${getCountry(region.country).path}${region.id}/`;
}
