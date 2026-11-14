// Question mark button that shows and hides the help panel, and, on phones
// and small screens, the Menu button that shows and hides the side panel
// (Return home and the Show toggles).  Only one of the two opens at a time,
// so they never pile up over the view.  On a desktop-sized screen the side
// panel is always showing and the Menu button is hidden (see style.css).

export function bindInfoPanel() {
  const toggle = document.querySelector('.info-toggle');
  const panel = document.getElementById('info');
  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('show');

  const setHelpOpen = (open) => {
    if (!toggle || !panel) return;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  const setMenuOpen = (open) => {
    if (!menuToggle || !menu) return;
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  };

  const menuOpen = () => menu?.classList.contains('open') ?? false;

  toggle?.addEventListener('click', () => {
    toggle.blur();
    const open = panel.hidden;
    if (open) setMenuOpen(false);
    setHelpOpen(open);
  });
  panel?.querySelector('.info-close')?.addEventListener('click', () => setHelpOpen(false));

  menuToggle?.addEventListener('click', () => {
    menuToggle.blur();
    const open = !menuOpen();
    if (open) setHelpOpen(false);
    setMenuOpen(open);
  });
  // Returning home closes the menu so you can watch the glide.
  menu?.querySelector('.home-button')?.addEventListener('click', () => setMenuOpen(false));

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (panel && !panel.hidden) setHelpOpen(false);
    if (menuOpen()) setMenuOpen(false);
  });
}
