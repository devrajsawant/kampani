import { initializeEvents } from './components/events.js';
import { initializePerspectives } from './components/perspectives.js';
import { initializeCareers } from './components/careers.js';
import { initializeContact } from './components/contact.js';
import { initializeFooter } from './components/footer.js';
import { initializeNavigation } from './components/navbar.js';
import { initializeNetwork } from './components/network.js';

const componentNames = ['navbar', 'hero', 'about', 'offerings', 'network', 'people', 'perspectives', 'events', 'careers', 'contact', 'footer'];

async function loadComponent(name) {
  const slot = document.querySelector(`[data-component="${name}"]`);

  if (!slot) {
    throw new Error(`Missing page slot for "${name}".`);
  }

  const response = await fetch(`components/${name}.html`);
  if (!response.ok) {
    throw new Error(`Unable to load "${name}" component (${response.status}).`);
  }

  slot.innerHTML = await response.text();
}

async function initializePage() {
  try {
    await Promise.all(componentNames.map(loadComponent));
    initializeNavigation();
    initializeNetwork();
    initializeEvents();
    initializePerspectives();
    initializeCareers();
    initializeContact();
    initializeFooter();

    // Components load asynchronously, so restore direct section links afterwards.
    const section = document.getElementById(window.location.hash.slice(1));
    if (section) section.scrollIntoView();
  } catch (error) {
    console.error('Unable to render the page components.', error);
    const errorBanner = document.getElementById('component-error');
    errorBanner.textContent = 'Some page sections could not be loaded. Please refresh the page.';
    errorBanner.hidden = false;
  }
}

initializePage();