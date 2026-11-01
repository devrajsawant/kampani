export function initializeNavigation() {
  const root = document.getElementById('kc-navbar');
  if (!root) {
    throw new Error('The navigation component did not render.');
  }

  const toggle = root.querySelector('#kc-toggle');
  const menu = root.querySelector('#kc-nav-menu');
  const navLinks = root.querySelectorAll('.kc-links a');

  if (!toggle || !menu) {
    throw new Error('The navigation component is missing its menu controls.');
  }

  function closeMenu() {
    menu.classList.remove('kc-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
  }

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('kc-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? '✕' : '☰';
  });

  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      const target = targetId && targetId !== '#'
        ? document.getElementById(targetId.slice(1))
        : null;

      if (!target) return;

      event.preventDefault();
      closeMenu();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      window.history.replaceState(null, '', targetId);
    });
  });

  const sections = Array.from(navLinks)
    .map((link) => ({
      link,
      section: document.getElementById(link.getAttribute('href').slice(1)),
    }))
    .filter(({ section }) => section);

  let animationFramePending = false;

  function updateActiveLink() {
    const currentSection = sections
      .filter(({ section }) => section.getBoundingClientRect().top <= 160)
      .at(-1);

    navLinks.forEach((link) => {
      link.classList.toggle('kc-active', link === currentSection?.link);
    });

    animationFramePending = false;
  }

  window.addEventListener('scroll', () => {
    if (animationFramePending) return;
    animationFramePending = true;
    window.requestAnimationFrame(updateActiveLink);
  }, { passive: true });

  window.addEventListener('load', updateActiveLink);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  updateActiveLink();
}
