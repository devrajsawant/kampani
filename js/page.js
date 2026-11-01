import { initializeNavigation } from './components/navbar.js';
import { initializeFooter } from './components/footer.js';
import { initializeReader } from './components/blogs.js';
import { initializeJobDetails } from './components/job-details.js';

async function initializePage() {
  try {
    await Promise.all(Array.from(document.querySelectorAll('[data-component]'), async (slot) => {
      const url = new URL(`../components/${slot.dataset.component}.html`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Unable to load ${slot.dataset.component}.`);
      slot.innerHTML = await response.text();
    }));

    // Shared navigation must return to the homepage from a detail page.
    const home = new URL('../index.html', import.meta.url);
    document.querySelectorAll('#kc-navbar a[href^="#"], #kc-footer a[href^="#"]').forEach((link) => {
      link.href = home.href + link.getAttribute('href');
    });
    document.querySelector('#kc-footer a[href="disclaimer/"]').href =
      new URL('../disclaimer/', import.meta.url).href;

    initializeNavigation();
    initializeFooter();
    if (document.getElementById('kcReader')) initializeReader();
    if (document.getElementById('kcJobDetails')) initializeJobDetails();
  } catch (error) {
    console.error('Unable to render the page.', error);
    const banner = document.getElementById('component-error');
    banner.textContent = 'This page could not be loaded. Please refresh to try again.';
    banner.hidden = false;
  }
}

initializePage();
