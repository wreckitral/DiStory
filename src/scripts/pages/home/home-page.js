import HomePresenter from './home-presenter';
import * as DistoryAPI from '../../data/api';

export default class HomePage {
    #presenter = null;

    async render() {
        return `
            <section>
              <h2>All Stories</h2>
              <div class="notification-controls">
                <button id="enable-notifications" class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="notification-icon">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  Enable
                </button>
                <button id="disable-notifications" class="btn btn-secondary" style="display: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="notification-icon">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  Disable
                </button>
              </div>
              <div id="main-map-container" style="height: 400px; margin-bottom: 20px; z-index:1;"></div>
              <div id="stories-container">
                <div class="stories-loading">
                    <div class="spinner"></div>
                </div>
              </div>
            </section>
        `;
    }

    async afterRender() {
        this.#presenter = new HomePresenter({
            view: this,
            model: DistoryAPI,
        });

        await this.#presenter.initNotificationControls();

        await this.#presenter.loadStories();
    }

    showLoading() {
        const container = document.getElementById('stories-container');
        container.innerHTML = `
            <div class="stories-loading">
                <div class="spinner"></div>
            </div>
        `;
    }

    showStories(stories) {
        const container = document.getElementById('stories-container');
        if (stories.length === 0) {
            container.innerHTML = `
                <div class="empty-stories">
                    <h3>No stories found</h3>
                    <p>Be the first to share your story!</p>
                </div>
            `;
            return;
        }
        container.innerHTML = stories
            .map((story) => this.#presenter.getStoryTemplate(story))
            .join('');

        const storyCards = document.querySelectorAll('.story-card');
        storyCards.forEach((card) => {
            card.addEventListener('click', () => {
                const storyId = card.dataset.storyId;
                this.#presenter.navigateToStoryDetail(storyId);
            });
        });
        this.#presenter.initializeMap(stories);
    }

    updateNotificationUIState(state) {
        const enableBtn = document.getElementById('enable-notifications');
        const disableBtn = document.getElementById('disable-notifications');

        // Removing the status span updates

        if (!state.isSupported) {
            enableBtn.disabled = true;
            return;
        }

        if (state.isLoading) {
            enableBtn.disabled = true;
            disableBtn.disabled = true;
            return;
        }

        if (state.error) {
            enableBtn.disabled = false;
            disableBtn.disabled = false;
            return;
        }

        if (state.isSubscribed) {
            enableBtn.style.display = 'none';
            disableBtn.style.display = 'inline-block';
            disableBtn.disabled = false;
        } else {
            enableBtn.style.display = 'inline-block';
            disableBtn.style.display = 'none';
            enableBtn.disabled = false;
        }
    }
}
