import FavoritesPresenter from './favorites-presenter';
import * as DistoryAPI from '../../data/api';

export default class FavoritesPage {
    #presenter = null;

    constructor() {
        this.favorites = [];
        this.isLoading = true;
    }

    async render() {
        return `
            <section class="favorites-page">
                <div class="favorites-header">
                    <h2>Your Favorite Stories</h2>
                    <p class="favorites-description">Stories you've saved for later.</p>
                </div>

                <div id="favorites-container">
                    <div class="favorites-loading">Loading your favorites...</div>
                </div>
            </section>
        `;
    }

    async afterRender() {
        this.#presenter = new FavoritesPresenter({
            view: this,
            model: DistoryAPI,
        });

        await this.#presenter.loadFavorites();
    }

    showFavorites(favorites) {
        const container = document.getElementById('favorites-container');
        this.isLoading = false;

        if (favorites.length === 0) {
            container.innerHTML = this._getEmptyFavoritesTemplate();
            return;
        }

        container.innerHTML = `
            <div id="favorites-list" class="favorites-grid">
                ${favorites.map((story) => this._getStoryCardTemplate(story)).join('')}
            </div>
        `;

        document.querySelectorAll('.story-card').forEach((card) => {
            card.addEventListener('click', (event) => {
                const storyId = event.currentTarget.dataset.id;
                window.location.href = `#/detail-story/${storyId}`;
            });
        });

        document.querySelectorAll('.remove-favorite-btn').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                const storyId = event.currentTarget.dataset.id;
                await this.#presenter.removeFromFavorites(storyId);
            });
        });
    }

    updateFavoritesList(favorites) {
        this.favorites = favorites;
        this.showFavorites(favorites);
    }

    showLoading() {
        const container = document.getElementById('favorites-container');
        container.innerHTML = `<div class="favorites-loading">Loading your favorites...</div>`;
        this.isLoading = true;
    }

    showError(message) {
        const container = document.getElementById('favorites-container');
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button id="retry-button" class="btn-primary">Retry</button>
            </div>
        `;

        document.getElementById('retry-button').addEventListener('click', () => {
            this.showLoading();
            this.#presenter.loadFavorites();
        });
    }

    _getEmptyFavoritesTemplate() {
        return `
            <div class="empty-favorites">
                <div class="empty-icon">❤️</div>
                <h3>No Favorites Yet</h3>
                <p>Stories you mark as favorites will appear here.</p>
                <a href="#/" class="btn-primary">Browse Stories</a>
            </div>
        `;
    }

    _getStoryCardTemplate(story) {
        return `
            <div class="story-card" data-id="${story.id}">
                <div class="story-thumbnail">
                    <img src="${story.photoUrl || '/images/default-story.jpg'}" alt="${story.name}">
                </div>
                <div class="story-card-content">
                    <h3 class="story-title">${story.name}</h3>
                    <p class="story-date">${story.formattedDate || 'No date'}</p>
                    <p class="story-excerpt">${story.description || 'No description available'}</p>
                </div>
                <div class="story-card-footer favorite-footer">
                    <span class="story-location">${story.location || 'No location'}</span>
                    <button class="remove-favorite-btn" data-id="${story.id}">
                        <span class="favorite-icon">❌</span> Remove
                    </button>
                </div>
            </div>
        `;
    }
}
