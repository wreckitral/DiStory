import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

let mapInstance = null;

const blueIcon = new L.Icon({
    iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export function initMap(containerId, center = [-2.5489, 118.0149], zoom = 5) {
    if (mapInstance) {
        mapInstance.remove();
    }

    mapInstance = L.map(containerId).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance);

    return mapInstance;
}

export function renderGeoJSON(map, stories = []) {
    const geojsonFeatures = stories
        .filter((story) => story.lat && story.lon)
        .map((story) => ({
            type: 'Feature',
            properties: {
                name: story.name,
                description: story.description,
                photoUrl: story.photoUrl,
            },
            geometry: {
                type: 'Point',
                coordinates: [story.lon, story.lat],
            },
        }));

    const geojsonLayer = L.geoJSON(
        {
            type: 'FeatureCollection',
            features: geojsonFeatures,
        },
        {
            pointToLayer: (feature, latlng) =>
                L.marker(latlng, { icon: blueIcon }).bindPopup(
                    `<b>${feature.properties.name}</b><br>${feature.properties.description}<br><img src="${feature.properties.photoUrl}" width="100">`,
                ),
        },
    );

    geojsonLayer.addTo(map);
}
