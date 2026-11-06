/** Small string helpers for the static templates. */

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
export const e = escapeHtml;

/** French typography: a narrow no-break space before ; : ! ? and inside « », so they never start a line. */
export function frenchSpacing(text) {
  return String(text).replace(/ ([;:!?»])/g, '\u202F$1').replace(/« /g, '«\u202F');
}

/** Paragraphs from an array of strings (French spacing when `french` is set). */
export function paras(list, attrs = '', { french = false } = {}) {
  return (list || []).map((text) => `<p${attrs}>${e(french ? frenchSpacing(text) : text)}</p>`).join('');
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2018-01-06" → "6 January 2018" (no Intl, so the build and the tests never depend on the system locale). */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.…]+$/, '')}…`;
}
