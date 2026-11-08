/**
 * The only script on the site, and optional: every page works without it.
 * - the menu folds behind a button on small screens;
 * - the masthead shows the reader's own date.
 */
document.documentElement.classList.add('js');

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

/**
 * Front page: the latest statements one at a time, with numbered tabs above and Previous / Next
 * below. Never moves on its own. Without JavaScript every statement is shown, one after the other.
 */
for (const box of document.querySelectorAll('[data-carousel]')) {
  const slides = [...box.querySelectorAll('[data-slide]')];
  if (slides.length < 2) continue;
  const tabs = [...box.querySelectorAll('[data-go]')];
  const pos = box.querySelector('.carousel-pos');
  box.querySelectorAll('.carousel-bar, .carousel-foot').forEach((el) => (el.hidden = false));
  let index = 0;
  const show = (i, { scroll = false } = {}) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.toggleAttribute('data-inactive', j !== index));
    tabs.forEach((t, j) => t.setAttribute('aria-current', String(j === index)));
    // phones: slide the strip of tabs so the current one is visible (never scrolls the page itself)
    const strip = tabs[index].closest('.carousel-tabs');
    const li = tabs[index].parentElement;
    if (strip && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = Math.max(0, li.offsetLeft - strip.offsetLeft - 20);
    if (pos) pos.textContent = `${index + 1} / ${slides.length}`;
    if (scroll) box.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  // a link to #slide-3 opens the third statement
  const fromHash = slides.findIndex((s) => `#${s.id}` === window.location.hash);
  show(fromHash > 0 ? fromHash : 0);
  box.addEventListener('click', (event) => {
    const go = event.target.closest('[data-go]');
    const step = event.target.closest('[data-step]');
    if (go) show(Number(go.dataset.go));
    if (step) show(index + Number(step.dataset.step), { scroll: true });
  });
}

/** Archives calendar: one month at a time, newest first, with arrows. */
for (const cal of document.querySelectorAll('[data-cal]')) {
  const months = [...cal.querySelectorAll('[data-cal-month]')];
  const nav = cal.querySelector('.cal-nav');
  if (!nav || months.length < 2) continue;
  nav.hidden = false;
  const pos = nav.querySelector('.cal-pos');
  const [older, newer] = nav.querySelectorAll('[data-cal-step]');
  let index = 0;
  const show = (i) => {
    index = Math.max(0, Math.min(months.length - 1, i));
    months.forEach((m, j) => m.toggleAttribute('data-inactive', j !== index));
    pos.textContent = months[index].getAttribute('aria-label');
    older.disabled = index === months.length - 1;
    newer.disabled = index === 0;
  };
  show(0);
  nav.addEventListener('click', (event) => {
    const step = event.target.closest('[data-cal-step]');
    if (step) show(index + Number(step.dataset.calStep));
  });
}

/**
 * Under each statement: the four editorial sections as tabs (Switzerland & France, United States,
 * United Kingdom, The Diplomat). Arrow keys move between tabs. Without JavaScript every section is
 * shown, one after the other, each with its heading.
 */
for (const box of document.querySelectorAll('[data-tabs]')) {
  const tabs = [...box.querySelectorAll('[role="tab"]')];
  if (!tabs.length) continue;
  // the same tabs appear twice (above and below the versions): select by panel
  const select = (tab, { focus = false, scroll = false } = {}) => {
    const panelId = tab.getAttribute('aria-controls');
    for (const t of tabs) {
      const on = t.getAttribute('aria-controls') === panelId;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls'))?.toggleAttribute('data-inactive', !on);
    }
    if (focus) tab.focus();
    // chosen from the bottom row: bring the start of the section into view
    if (scroll) box.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  box.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab && tabs.includes(tab)) select(tab, { scroll: Boolean(tab.closest('.sections-tabs--bottom')) });
  });
  box.addEventListener('keydown', (event) => {
    const row = [...(document.activeElement?.closest('.sections-tabs')?.querySelectorAll('[role="tab"]') || [])];
    const i = row.indexOf(document.activeElement);
    if (i < 0) return;
    const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: row.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(row[(keys[event.key] + row.length) % row.length], { focus: true });
  });
}

/**
 * Audience measurement: Cloudflare Web Analytics (no cookies, no personal data). Only on the live
 * domain, and never for visitors who ask not to be tracked (Do Not Track, Global Privacy Control).
 * The token is public by design.
 */
const ANALYTICS_TOKEN = 'f99cc3011b7f474d80e03e9ffce0cec8';
const optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
if (ANALYTICS_TOKEN && window.location.hostname === 'bigbeautifulflop.com' && !optedOut) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: ANALYTICS_TOKEN });
  document.head.append(beacon);
}
