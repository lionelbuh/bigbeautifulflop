/**
 * Regional editions. Adding a region = adding one entry here, then writing its versions
 * in content/statements/*.json under `editions.<id>`. Pages, navigation, sitemap and the
 * daily rotation pick it up automatically.
 *
 * `english` says what the "English" link under a version shows: `translate` (the default, for French
 * versions: "English version"), `plain` (American and British versions: "In plain English"), `meaning`
 * (the British diplomat: "What he really means"), or `none`.
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
  {
    id: 'united-states',
    name: 'United States',
    native: 'United States',
    path: '/united-states/',
    lang: 'en-US',
    flag: 'us',
    description:
      'Not accents but attitudes: the same statement as it would come out of New York, Texas, the Deep South, California, Boston and the Midwest.',
  },
  {
    id: 'united-kingdom',
    name: 'United Kingdom',
    native: 'United Kingdom',
    path: '/united-kingdom/',
    lang: 'en-GB',
    flag: 'gb',
    description:
      'Understatement, irony and a raised eyebrow: the statement retold from London to Liverpool, Manchester, Yorkshire, Scotland and Wales.',
  },
  {
    id: 'diplomat',
    name: 'The Diplomat',
    native: 'Statesmen',
    path: '/diplomat/',
    lang: 'en',
    flag: 'lectern',
    description:
      'The same message, as a serious and competent statesman would deliver it: an American President, a British diplomat and a Swiss Federal President. Fictional interpretations, never real statements.',
  },
];

/** The four editorial sections; each groups one or more countries. */
export const CATEGORIES = [
  { id: 'switzerland-france', name: 'Switzerland & France', path: '/switzerland-france/', countries: ['switzerland', 'france'], flags: ['ch', 'fr'] },
  { id: 'united-states', name: 'United States', path: '/united-states/', countries: ['united-states'], flags: ['us'] },
  { id: 'united-kingdom', name: 'United Kingdom', path: '/united-kingdom/', countries: ['united-kingdom'], flags: ['gb'] },
  { id: 'diplomat', name: 'The Diplomat', path: '/diplomat/', countries: ['diplomat'], flags: ['lectern'] },
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
  // United States: attitudes and vocabulary, not phonetic accents
  {
    id: 'new-york',
    country: 'united-states',
    name: 'New York',
    place: 'New York City',
    lang: 'en-US',
    english: 'plain',
    chip: ['#1c1b19', '#f2c200'],
    voice: 'Fast, direct, impatient, sarcastic and street-smart. Has already heard it all, usually from a guy on the subway.',
  },
  {
    id: 'texas',
    country: 'united-states',
    name: 'Texas',
    place: 'Austin, Dallas, Houston',
    lang: 'en-US',
    english: 'plain',
    chip: ['#bf0a30', '#ffffff'],
    voice: 'Confident, larger than life, warm and outspoken. Everything is bigger, including the opinions.',
  },
  {
    id: 'deep-south',
    country: 'united-states',
    name: 'Deep South',
    place: 'Georgia, Alabama, Mississippi',
    lang: 'en-US',
    english: 'plain',
    chip: ['#2f8f4e', '#f6f2ea'],
    voice: 'Polite on the surface, expressive and charming, and capable of devastating sarcasm while pouring you more sweet tea.',
  },
  {
    id: 'california',
    country: 'united-states',
    name: 'California',
    place: 'Los Angeles, San Francisco',
    lang: 'en-US',
    english: 'plain',
    chip: ['#f2c200', '#1f3a5f'],
    voice: 'Relaxed, casual, optimistic and quietly ironic. Is probably building the thing you are worried about.',
  },
  {
    id: 'boston',
    country: 'united-states',
    name: 'Boston',
    place: 'Boston, Massachusetts',
    lang: 'en-US',
    english: 'plain',
    chip: ['#007a33', '#ffffff'],
    voice: 'Blunt, sharp, sarcastic and no-nonsense. Was arguing about this before the country existed.',
  },
  {
    id: 'midwest',
    country: 'united-states',
    name: 'Midwest',
    place: 'Minnesota, Ohio, Iowa',
    lang: 'en-US',
    english: 'plain',
    chip: ['#e8b923', '#2f8f4e'],
    voice: 'Friendly, modest and practical. Would never say no to your face, and will bring a casserole either way.',
  },
  // United Kingdom: understatement, irony, dry wit
  {
    id: 'london',
    country: 'united-kingdom',
    name: 'London',
    place: 'London',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#b3121a', '#1c1b19'],
    voice: 'Sophisticated, urban and dry. Says “interesting” and means something else entirely.',
  },
  {
    id: 'liverpool',
    country: 'united-kingdom',
    name: 'Liverpool',
    place: 'Liverpool, Merseyside',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#c8102e', '#f6f2ea'],
    voice: 'Expressive, familiar, funny and outspoken. Will call you “lad” and tell you exactly what they think.',
  },
  {
    id: 'manchester',
    country: 'united-kingdom',
    name: 'Manchester',
    place: 'Manchester',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#1c1b19', '#f2c200'],
    voice: 'Direct, witty and slightly sarcastic. Did most things first and will mention it.',
  },
  {
    id: 'yorkshire',
    country: 'united-kingdom',
    name: 'Yorkshire',
    place: 'Leeds, Sheffield, York',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#ffffff', '#1f6fb5'],
    voice: 'Blunt, understated, practical and self-deprecating. Will consider your proposal once they know what it costs.',
  },
  {
    id: 'scotland',
    country: 'united-kingdom',
    name: 'Scotland',
    place: 'Glasgow, Edinburgh',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#0065bd', '#ffffff'],
    voice: 'Sharp, ironic and colourful. Invented half the modern world and remains unimpressed by the other half.',
  },
  {
    id: 'wales',
    country: 'united-kingdom',
    name: 'Wales',
    place: 'Cardiff, Swansea',
    lang: 'en-GB',
    english: 'plain',
    chip: ['#00b140', '#d30731'],
    voice: 'Warm, expressive and gently understated. Will get round to it “now in a minute”.',
  },
  // The Diplomat (the American President is the presidential version of each statement)
  {
    id: 'british-diplomat',
    country: 'diplomat',
    name: 'The British Diplomat',
    place: 'A senior British diplomat or Prime Minister',
    lang: 'en-GB',
    english: 'meaning',
    chip: ['#012169', '#c8102e'],
    voice: 'Elegant, polite and measured, with subtle understatement and the occasional dry joke. Never confrontational without reason.',
  },
  {
    id: 'swiss-president',
    country: 'diplomat',
    name: 'The Swiss President',
    place: 'A President of the Swiss Confederation',
    lang: 'en',
    english: 'none',
    chip: ['#d52b1e', '#ffffff'],
    voice: 'Neutral, measured and conciliatory. Looks for consensus, trusts institutions and leaves the last word to the people.',
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

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id);
}

export function categoryOf(countryId) {
  return CATEGORIES.find((c) => c.countries.includes(countryId));
}

/** The label of the English link under a version (null: no link). */
export function englishLabel(region) {
  return { translate: 'English version', plain: 'In plain English', meaning: 'What he really means', none: null }[region.english || 'translate'];
}

export function regionPath(region) {
  return `${getCountry(region.country).path}${region.id}/`;
}
