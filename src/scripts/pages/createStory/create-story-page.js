import CreateStoryPresenter from './create-story-presenter';
import * as DistoryAPI from '../../data/api';
import Camera from '../../utils/camera';

export default class CreateStoryPage {
    #presenter = null;

    async render() {
        return `
            <section class="create-story-page">
                <h2>Add New Story</h2>
                <div class="story-form-container">
                    <form id="create-story-form" class="create-story-form">
                        <div class="input-group">
                            <label for="description-input" class="form-label">Description</label>
                            <textarea
                                id="description-input"
                                name="description"
                                class="form-input"
                                placeholder="Enter story description"
                                rows="4"
                                required
                            ></textarea>
                        </div>

                        <div class="input-group">
                            <label for="photo-input" class="form-label">Photo</label>
                            <input
                                type="file"
                                id="photo-input"
                                name="photo"
                                class="form-input"
                                accept="image/*"
                                required
                            />
                            <small class="input-help">Maximum file size: 1MB</small>
                        </div>

                        <div class="input-group">
                            <label class="form-label">Or Take a Photo</label>
                            <div class="camera-container">
                                <video id="video" autoplay playsinline style="max-width: 100%;"></video>
                                <canvas id="canvas" style="display: none;"></canvas>
                                <div>
                                    <select id="cameraSelect"></select>
                                    <button type="button" id="takePicture">📸 Ambil Gambar</button>
                                </div>
                            </div>
                        </div>

                        <div class="input-group">
                            <label class="form-label">Location (Optional)</label>
                            <div class="location-inputs">
                                <div class="input-group">
                                    <label for="lat-input" class="form-label">Latitude</label>
                                    <input
                                        type="number"
                                        id="lat-input"
                                        name="lat"
                                        class="form-input"
                                        placeholder="e.g. -6.2088"
                                        step="any"
                                    />
                                </div>
                                <div class="input-group">
                                    <label for="lon-input" class="form-label">Longitude</label>
                                    <input
                                        type="number"
                                        id="lon-input"
                                        name="lon"
                                        class="form-input"
                                        placeholder="e.g. 106.8456"
                                        step="any"
                                    />
                                </div>
                            </div>

                            <button type="button" id="use-current-location" class="btn-secondary">
                                Use My Current Location
                            </button>

                            <div class="map-container-form" style="margin-top: 1rem;">
                                <div id="map-on-form" style="height: 300px;"></div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <div id="submit-button-container">
                                <button type="submit" class="btn-primary">Add Story</button>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        `;
    }

    async afterRender() {
        this.#presenter = new CreateStoryPresenter({
            view: this,
            model: DistoryAPI,
        });

        this.#setupForm();
        this.#setupLocationButton();

        const camera = new Camera({
            video: document.getElementById('video'),
            cameraSelect: document.getElementById('cameraSelect'),
            canvas: document.getElementById('canvas'),
        });

        camera.launch();
        camera.addCheeseButtonListener('#takePicture', async () => {
            const blob = await camera.takePicture();

            if (!blob) {
                alert('Gagal mengambil gambar!');
                return;
            }

            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const photoInput = document.getElementById('photo-input');
            photoInput.files = dataTransfer.files;
        });

        const latInput = document.getElementById('lat-input');
        const lonInput = document.getElementById('lon-input');
        const useLocationBtn = document.getElementById('use-current-location');

        this.#presenter.initInteractiveMap({
            latInput,
            lonInput,
            useLocationBtn,
            mapContainerId: 'map-on-form',
        });
    }

    #setupForm() {
        document.getElementById('create-story-form').addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData();
            formData.append('description', document.getElementById('description-input').value);

            const photoInput = document.getElementById('photo-input');
            if (photoInput.files && photoInput.files[0]) {
                formData.append('photo', photoInput.files[0]);
            }

            const lat = document.getElementById('lat-input').value;
            const lon = document.getElementById('lon-input').value;

            if (lat && lon) {
                formData.append('lat', lat);
                formData.append('lon', lon);
            }

            this.showSubmitLoadingButton();
            await this.#presenter.createStory(formData);
        });
    }

    #setupLocationButton() {
        document.getElementById('use-current-location').addEventListener('click', () => {
            this.#presenter.getCurrentLocation();
        });
    }

    showCreateSuccess(message) {
        alert(message);
        location.hash = '/';
    }

    showCreateFailed(message) {
        alert(message);
        this.hideSubmitLoadingButton();
    }

    showSubmitLoadingButton() {
        document.getElementById('submit-button-container').innerHTML = `
            <button type="submit" class="btn-primary btn-loading" disabled>
                <span class="spinner"></span>
                Submitting...
            </button>
        `;
    }

    hideSubmitLoadingButton() {
        document.getElementById('submit-button-container').innerHTML = `
            <button type="submit" class="btn-primary">Add Story</button>
        `;
    }

    displayLocation(lat, lon) {
        document.getElementById('lat-input').value = lat;
        document.getElementById('lon-input').value = lon;
    }

    showLocationError(message) {
        alert(message);
    }
}
