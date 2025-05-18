import StoryDetailPresenter from './story-detail-presenter';
import * as DistoryAPI from '../../data/api';
import { parseActivePathname } from '../../routes/url-parser';

export default class StoryDetailPage {
    #presenter = null;

    constructor() {
        this.storyId = parseActivePathname().id;
    }

    async render() {
        return `
            <section class="story-detail">
                <div id="story-container">
                    <div class="loading">Loading story details...</div>
                </div>
                <div id="story-map-container" style="height: 400px; margin: 20px 0; z-index:1;"></div>
                <div class="story-actions">
                    <button id="back-button" class="btn">Back to Stories</button>
                    <button id="favorite-button" class="btn">
                        <span id="favorite-icon">🤍</span> Add to Favorites
                    </button>
                </div>
            </section>
        `;
    }

    async afterRender() {
        this.#presenter = new StoryDetailPresenter({
            view: this,
            model: DistoryAPI,
        });

        if (!this.storyId) {
            this.showError('Story ID not found');
            return;
        }

        document.getElementById('back-button').addEventListener('click', () => {
            window.history.back();
        });

        document.getElementById('favorite-button').addEventListener('click', () => {
            this.#presenter.toggleFavorite();
        });

        await this.#presenter.loadStory(this.storyId);
        await this.#presenter.checkFavoriteStatus(this.storyId);
    }

    showStory(story) {
        const container = document.getElementById('story-container');
        container.innerHTML = `
            <div class="story-header">
                <h2>${story.name}</h2>
                <p class="story-metadata">
                    By ${story.name || 'Anonymous'} on ${story.formattedDate}
                </p>
            </div>
            <div class="story-content">
                <div class="story-description">${story.description}</div>
                ${story.photoUrl ? `<img src="${story.photoUrl}" alt="${story.name}" class="story-image">` : ''}
            </div>
        `;

        if (story.lat && story.lon) {
            this.#presenter.initializeMap(story);
        } else {
            document.getElementById('story-map-container').style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('story-container');
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button id="error-back-button" class="btn">Back to Stories</button>
            </div>
        `;

        document.getElementById('error-back-button').addEventListener('click', () => {
            window.history.back();
        });

        document.getElementById('story-map-container').style.display = 'none';
        document.querySelector('.story-actions').style.display = 'none';
    }

    updateFavoriteButton(isFavorite) {
        const favoriteButton = document.getElementById('favorite-button');
        const favoriteIcon = document.getElementById('favorite-icon');

        if (isFavorite) {
            favoriteIcon.textContent = '❤️';
            favoriteButton.textContent = ' Remove from Favorites';
            favoriteButton.appendChild(favoriteIcon);
        } else {
            favoriteIcon.textContent = '🤍';
            favoriteButton.textContent = ' Add to Favorites';
            favoriteButton.appendChild(favoriteIcon);
        }
    }
}
