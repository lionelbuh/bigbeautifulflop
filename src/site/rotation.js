/**
 * "Edition of the day": which Swiss and French versions come first under each statement.
 * Used at build time; the site rebuilds every night. Pure and deterministic: same date, same order.
 */
const DAY = 86400000;

/** Whole days since 1 January 1970, for a calendar date (local date in the browser, UTC at build). */
export function dayNumber(date = new Date(), { utc = false } = {}) {
  const y = utc ? date.getUTCFullYear() : date.getFullYear();
  const m = utc ? date.getUTCMonth() : date.getMonth();
  const d = utc ? date.getUTCDate() : date.getDate();
  return Math.floor(Date.UTC(y, m, d) / DAY);
}

/** Index of the edition of the day among `count` editions. */
export function editionIndex(count, day) {
  if (count <= 0) return -1;
  return ((day % count) + count) % count;
}
