{
/**
 * "Edition of the day": which regional version a switcher opens on.
 * Shared by the build (the static default) and the browser (so the choice follows the reader's
 * date even between two builds). Pure and deterministic: same date, same edition, everywhere.
 */
const DAY = 86400000;

/** Whole days since 1 January 1970, for a calendar date (local date in the browser, UTC at build). */
function dayNumber(date = new Date(), { utc = false } = {}) {
  const y = utc ? date.getUTCFullYear() : date.getFullYear();
  const m = utc ? date.getUTCMonth() : date.getMonth();
  const d = utc ? date.getUTCDate() : date.getDate();
  return Math.floor(Date.UTC(y, m, d) / DAY);
}

/** Index of the edition of the day among `count` editions. */
function editionIndex(count, day) {
  if (count <= 0) return -1;
  return ((day % count) + count) % count;
}

/**
 * The only script on the site, and optional: every page works without it.
 * - edition switchers become tabs, opened on the reader's edition of the day;
 * - the menu folds behind a button on small screens;
 * - the masthead shows the reader's own date.
 */


document.documentElement.classList.add('js');

const today = dayNumber(new Date());

function select(switcher, tab, { focus = false } = {}) {
  for (const t of switcher.querySelectorAll('[role="tab"]')) {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    if (panel) panel.toggleAttribute('data-inactive', !on);
  }
  if (focus) tab.focus();
}

for (const switcher of document.querySelectorAll('[data-switcher]')) {
  const tabs = [...switcher.querySelectorAll('[role="tab"]')];
  // A link to one edition (#…-vaudois) opens it; otherwise the edition of the day.
  const fromHash = tabs.find((t) => `#${t.getAttribute('aria-controls')}` === window.location.hash);
  select(switcher, fromHash || tabs[editionIndex(tabs.length, today)]);
  switcher.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(switcher, tab);
  });
  switcher.addEventListener('keydown', (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(switcher, tabs[(keys[event.key] + tabs.length) % tabs.length], { focus: true });
  });
}

const toggle = document.querySelector('.nav-toggle');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  document.querySelector('.site-nav').classList.toggle('nav-open', open);
});

const date = document.querySelector('[data-today]');
if (date) {
  date.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

}
