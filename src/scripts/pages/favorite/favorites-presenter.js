export default class FavoritesPresenter {
    #view = null;
    #model = null;

    constructor({ view, model }) {
        this.#view = view;
        this.#model = model;
    }

    async loadFavorites() {
        try {
            this.#view.showLoading();

            const response = await this.#model.getFavorites();

            if (!response.ok) {
                this.#view.showError(response.message || 'Failed to load favorites');
                return;
            }

            const favorites = response.data || [];
            const formattedFavorites = favorites.map((favorite) => this._formatStoryData(favorite));

            this.#view.updateFavoritesList(formattedFavorites);
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.#view.showError('An unexpected error occurred while loading favorites');
        }
    }

    async removeFromFavorites(storyId) {
        try {
            const response = await this.#model.removeFromFavorites(storyId);

            if (!response.ok) {
                console.error('Failed to remove from favorites:', response.message);
                return;
            }

            await this.loadFavorites();
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }

    _formatStoryData(story) {
        return {
            ...story,
            formattedDate: story.createdAt
                ? this._formatDate(story.createdAt)
                : 'No date available',
            location:
                story.location ||
                (story.lat && story.lon ? `${story.lat}, ${story.lon}` : 'No location'),
        };
    }

    _formatDate(dateString) {
        try {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };

            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }
}
