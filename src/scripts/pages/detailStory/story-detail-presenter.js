import { initMap, renderGeoJSON } from '../../utils/map';

export default class StoryDetailPresenter {
    constructor({ view, model }) {
        this.view = view;
        this.model = model;
        this.story = null;
        this.isFavorite = false;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    }

    async loadStory(id) {
        try {
            const response = await this.model.getStoryById(id);

            if (response.error == false) {
                this.story = {
                    ...response.story,
                    formattedDate: this.formatDate(response.story.createdAt),
                };
                this.view.showStory(this.story);
            } else {
                this.view.showError(response.message || 'Story not found');
            }
        } catch (error) {
            console.error('Failed to load story:', error);
            this.view.showError('Failed to load the story. Please try again later.');
        }
    }

    async checkFavoriteStatus(id) {
        try {
            const response = await this.model.checkIsFavorite(id);
            if (response.ok) {
                this.isFavorite = response.data;
                this.view.updateFavoriteButton(this.isFavorite);
            }
        } catch (error) {
            console.error('Failed to check favorite status:', error);
        }
    }

    async toggleFavorite() {
        if (!this.story) return;

        try {
            let response;

            if (this.isFavorite) {
                response = await this.model.removeFromFavorites(this.story.id);
                if (response.ok) {
                    this.isFavorite = false;
                }
            } else {
                response = await this.model.addToFavorites(this.story);
                if (response.ok) {
                    this.isFavorite = true;
                }
            }

            this.view.updateFavoriteButton(this.isFavorite);

            if (!response.ok) {
                console.error('Failed to update favorite status:', response.message);
            }
        } catch (error) {
            console.error('Failed to toggle favorite status:', error);
        }
    }

    initializeMap(story) {
        const lat = parseFloat(story.lat);
        const lon = parseFloat(story.lon);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            document.getElementById('story-map-container').style.display = 'none';
            return;
        }

        const map = initMap('story-map-container', [lat, lon], 13);

        const storyWithPopup = {
            ...story,
            description: `
                <strong>${story.name}</strong><br>
                ${story.description}<br>
                <strong>Created:</strong> ${story.formattedDate || this.formatDate(story.createdAt)}
            `,
        };

        renderGeoJSON(map, [storyWithPopup]);
    }
}
