// Question mark button that shows and hides the help panel.

export function bindInfoPanel() {
  const toggle = document.querySelector('.info-toggle');
  const panel = document.getElementById('info');
  if (!toggle || !panel) return;
  const close = panel.querySelector('.info-close');

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close?.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !panel.hidden) setOpen(false);
  });
}
