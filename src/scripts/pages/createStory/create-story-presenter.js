import { initMap, renderGeoJSON } from '../../utils/map';

export default class CreateStoryPresenter {
    constructor({ view, model }) {
        this.view = view;
        this.model = model;
    }

    async createStory(formData) {
        try {
            this.#validateFormData(formData);

            const response = await this.model.createStory(formData);

            if (!response.error) {
                this.view.showCreateSuccess('Story added successfully!');
            } else {
                this.view.showCreateFailed(response.message || 'Failed to create story');
            }
        } catch (error) {
            this.view.showCreateFailed(error.message || 'An unexpected error occurred');
            console.error('Error creating story:', error);
        }
    }

    #validateFormData(formData) {
        const description = formData.get('description');
        if (!description || description.trim() === '') {
            throw new Error('Description is required');
        }

        const photo = formData.get('photo');
        if (!photo) {
            throw new Error('Photo is required');
        }

        if (photo.size > 1048576) {
            throw new Error('Photo size exceeds maximum limit of 1MB');
        }

        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!validImageTypes.includes(photo.type)) {
            throw new Error('Please select a valid image file (JPEG, PNG, or GIF)');
        }

        const lat = formData.get('lat');
        const lon = formData.get('lon');

        if ((lat && !lon) || (!lat && lon)) {
            throw new Error('Both latitude and longitude must be provided');
        }

        if (lat && lon) {
            const latValue = parseFloat(lat);
            const lonValue = parseFloat(lon);

            if (isNaN(latValue) || isNaN(lonValue)) {
                throw new Error('Location coordinates must be valid numbers');
            }

            if (latValue < -90 || latValue > 90) {
                throw new Error('Latitude must be between -90 and 90');
            }

            if (lonValue < -180 || lonValue > 180) {
                throw new Error('Longitude must be between -180 and 180');
            }
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.view.showLocationError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                this.view.displayLocation(latitude, longitude);
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'You denied the request for geolocation';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get your location timed out';
                        break;
                }

                this.view.showLocationError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            },
        );
    }

    initInteractiveMap({ latInput, lonInput, useLocationBtn, mapContainerId }) {
        const map = initMap(mapContainerId);
        let marker = null;

        const blueIcon = new L.Icon({
            iconUrl:
                'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });

        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            latInput.value = lat.toFixed(6);
            lonInput.value = lng.toFixed(6);

            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng], { icon: blueIcon })
                    .addTo(map)
                    .bindPopup(`Coordinates:<br>Lat: ${lat}<br>Lon: ${lng}`)
                    .openPopup();
            }
        });

        useLocationBtn.addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const { latitude, longitude } = coords;
                    latInput.value = latitude.toFixed(6);
                    lonInput.value = longitude.toFixed(6);

                    map.setView([latitude, longitude], 13);

                    if (marker) {
                        marker.setLatLng([latitude, longitude]);
                    } else {
                        marker = L.marker([latitude, longitude]).addTo(map);
                    }
                },
                (err) => {
                    alert('Gagal mendapatkan lokasi: ' + err.message);
                },
            );
        });
    }

    renderMapStories(stories) {
        renderGeoJSON(mapInstance, stories);
    }
}
