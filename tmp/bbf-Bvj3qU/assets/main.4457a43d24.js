{
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

}
