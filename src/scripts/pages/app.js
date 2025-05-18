import { getActiveRoute } from '../routes/url-parser';
import {
    createMainMenuTemplate,
    createGuestMenuTemplate,
    createLoggedInMenuTemplate,
} from '../templates';
import { setupSkipToContent } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import Camera from '../utils/camera';

export default class App {
    constructor({ mainContainer, menuToggle, sideNavigation, accessibilitySkipLink, footer }) {
        this.mainContainer = mainContainer;
        this.menuToggle = menuToggle;
        this.sideNavigation = sideNavigation;
        this.accessibilitySkipLink = accessibilitySkipLink;
        this.footer = footer;

        this.initialize();
    }

    initialize() {
        setupSkipToContent(this.accessibilitySkipLink, this.mainContainer);

        this.initializeNavigation();

        window.addEventListener('hashchange', () => this.loadPage());
        window.addEventListener('DOMContentLoaded', () => this.loadPage());
    }

    initializeNavigation() {
        this.menuToggle.addEventListener('click', () => {
            this.sideNavigation.classList.toggle('menu-visible');
            this.updateLayoutForNavigation();
        });

        document.addEventListener('click', (event) => {
            const clickedOutsideMenu = !this.sideNavigation.contains(event.target);
            const clickedOutsideToggle = !this.menuToggle.contains(event.target);

            if (clickedOutsideMenu && clickedOutsideToggle) {
                this.sideNavigation.classList.remove('menu-visible');
                this.updateLayoutForNavigation();
            }

            const isNavigationLink = event.target.closest('a[href^="#"]');
            if (isNavigationLink && this.sideNavigation.contains(isNavigationLink)) {
                this.sideNavigation.classList.remove('menu-visible');
                this.updateLayoutForNavigation();
            }
        });
    }

    updateLayoutForNavigation() {
        const isNavVisible = this.sideNavigation.classList.contains('menu-visible');
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            if (isNavVisible) {
                this.mainContainer.style.marginLeft = '250px';
                if (this.footer) this.footer.style.marginLeft = '250px';
            } else {
                this.mainContainer.style.marginLeft = '0';
                if (this.footer) this.footer.style.marginLeft = '0';
            }
        }
    }

    updateNavigationMenu() {
        const isAuthenticated = !!getAccessToken();
        const currentUrl = getActiveRoute();
        const isAuthPage = currentUrl === '/signin' || currentUrl === '/signup';

        const primaryNavContainer = this.sideNavigation.querySelector('.primary-nav');
        const secondaryNavContainer = this.sideNavigation.querySelector('.secondary-nav');

        if (!isAuthenticated && isAuthPage) {
            this.menuToggle.style.display = 'none';
            this.sideNavigation.style.display = 'none';

            this.mainContainer.style.marginLeft = '0';
            this.mainContainer.style.width = '100%';

            if (this.footer) {
                this.footer.style.marginLeft = '0';
                this.footer.style.width = '100%';
            }

            primaryNavContainer.innerHTML = '';
            secondaryNavContainer.innerHTML = '';

            return;
        } else {
            this.menuToggle.style.display = '';
            this.sideNavigation.style.display = '';

            this.mainContainer.style.marginLeft = '';
            this.mainContainer.style.width = '';
            this.mainContainer.style.display = 'block';
            this.mainContainer.style.padding = '';
            this.mainContainer.style.minHeight = '';
            this.mainContainer.style.alignItems = '';

            if (this.footer) {
                this.footer.style.marginLeft = '';
                this.footer.style.width = '';
            }
        }

        if (isAuthenticated) {
            primaryNavContainer.innerHTML = createMainMenuTemplate();
            secondaryNavContainer.innerHTML = createLoggedInMenuTemplate();

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (event) => {
                    event.preventDefault();

                    if (window.confirm('Are you sure you want to sign out from Distory?')) {
                        getLogout();
                        window.location.hash = '/signin';
                    }
                });
            }
        } else {
            primaryNavContainer.innerHTML = '';
            secondaryNavContainer.innerHTML = createGuestMenuTemplate();
        }
    }

    async loadPage() {
        Camera.stopAllStreams();
        const url = getActiveRoute();
        const route = routes[url];
        const pageInstance = route();
        const html = await pageInstance.render();

        if (!document.startViewTransition) {
            this.mainContainer.innerHTML = html;

            this.updateNavigationMenu();
            if (typeof pageInstance.afterRender === 'function') {
                await pageInstance.afterRender();
            }

            window.scrollTo({ top: 0, behavior: 'instant' });
            this.updatePageTitle(url);

            const isAuthPage = url === '/signin' || url === '/signup';
            const isAuthenticated = !!getAccessToken();
            if (!isAuthenticated && isAuthPage) {
                this.centerAuthForm();
            }

            const pageTitle = document.querySelector('h1, h2')?.textContent || url;
            this.announcePageChange(pageTitle);
            return;
        }

        const transition = document.startViewTransition(async () => {
            this.mainContainer.innerHTML = html;

            this.updateNavigationMenu();
            if (typeof pageInstance.afterRender === 'function') {
                await pageInstance.afterRender();
            }
        });

        transition.finished
            .then(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                this.updatePageTitle(url);
                const isAuthPage = url === '/signin' || url === '/signup';
                const isAuthenticated = !!getAccessToken();
                if (!isAuthenticated && isAuthPage) {
                    this.centerAuthForm();
                }
                const pageTitle = document.querySelector('h1, h2')?.textContent || url;
                this.announcePageChange(pageTitle);
            })
            .catch(console.error);
    }

    centerAuthForm() {
        const authForm =
            this.mainContainer.querySelector('form') ||
            this.mainContainer.querySelector('.auth-container') ||
            this.mainContainer.querySelector('.form-container');

        if (authForm) {
            this.mainContainer.style.display = 'flex';
            this.mainContainer.style.justifyContent = 'center';
            this.mainContainer.style.alignItems = 'center';
            this.mainContainer.style.minHeight = '100vh';

            this.mainContainer.style.padding = '0 20px';

            authForm.style.maxWidth = '450px';
            authForm.style.width = '100%';

            if (this.footer) {
                this.footer.style.display = 'none';
            }
        }
    }

    updatePageTitle(url) {
        const baseTitle = 'Distory - Share Your Stories';
        let pageTitle;

        switch (url) {
            case '/':
                pageTitle = baseTitle;
                break;
            case '/signin':
                pageTitle = 'Sign In | Distory';
                break;
            case '/signup':
                pageTitle = 'Join Distory | Create Account';
                break;
            case '/create-story':
                pageTitle = 'Write New Story | Distory';
                break;
            case '/my-stories':
                pageTitle = 'My Stories | Distory';
                break;
            case '/profile':
                pageTitle = 'My Profile | Distory';
                break;
            default:
                if (url.startsWith('/story/')) {
                    pageTitle = 'Reading Story | Distory';
                } else {
                    pageTitle = 'Distory';
                }
        }

        document.title = pageTitle;
    }

    announcePageChange(pageName) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('role', 'status');
        announcement.classList.add('sr-only');
        announcement.textContent = `Navigated to ${pageName} page`;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 3000);
    }

    showErrorMessage(message) {
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('error-notification');
        errorContainer.textContent = message;

        this.mainContainer.prepend(errorContainer);

        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
    }
}
