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
