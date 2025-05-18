// CSS imports
import '../styles/styles.css';
import '../styles/responsives.css';

// Import App
import App from './pages/app';
import { registerServiceWorker } from './utils';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Distory application initializing...');

    const app = new App({
        mainContainer: document.getElementById('main-content'),
        menuToggle: document.getElementById('menu-toggle'),
        sideNavigation: document.getElementById('side-navigation'),
        accessibilitySkipLink: document.querySelector('.skip-link'),
        footer: document.querySelector('footer'),
    });

    await app.loadPage();

    await registerServiceWorker();

    window.addEventListener('hashchange', async () => {
        await app.loadPage();
    });
});
