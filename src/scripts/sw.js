import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com',
    new StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
    }),
);

registerRoute(
    ({ url }) => url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 30,
            }),
        ],
    }),
);

registerRoute(
    ({ request }) => request.destination === 'image',
    new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
        ],
    }),
);

registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    }),
);

registerRoute(
    ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api'),
    new NetworkFirst({
        cacheName: 'api-responses',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
            }),
        ],
        networkTimeoutSeconds: 3,
    }),
);

registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        cacheName: 'pages',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
            }),
        ],
        networkTimeoutSeconds: 3,
    }),
);

registerRoute(
    ({ url }) => url.hostname.includes('tile.openstreetmap.org'),
    new CacheFirst({
        cacheName: 'openstreetmap-tiles',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 1000,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
        ],
    }),
);

registerRoute(
    ({ url }) => url.href.includes('story-api.dicoding.dev/images/stories'),
    new StaleWhileRevalidate({
        cacheName: 'story-api-images',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 200,
                maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days - increased from 7
            }),
        ],
    }),
);

registerRoute(
    ({ url }) => url.pathname.includes('/icons/'),
    new CacheFirst({
        cacheName: 'app-icons',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            }),
        ],
    }),
);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('app-icons').then((cache) => {
            return cache
                .addAll([
                    '/icons/128x128.ico',
                    '/icons/72x72.ico',
                    '/icons/256x256.ico',
                    '/images/placeholder-story.jpg',
                    '/images/default-story.jpg',
                    '/images/offline-map.svg',
                ])
                .catch((error) => {
                    console.log('Failed to cache essential icons:', error);
                });
        }),
    );
});

const createOfflineMapTile = () => {
    return new Response(
        `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" fill="#f0f0f0" />
            <path d="M0,0 L256,0 L256,256 L0,256 Z" fill="none" stroke="#ddd" />
            <path d="M64,0 L64,256 M128,0 L128,256 M192,0 L192,256" stroke="#ddd" />
            <path d="M0,64 L256,64 M0,128 L256,128 M0,192 L256,192" stroke="#ddd" />
            <text x="128" y="128" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">Map tile unavailable</text>
            <text x="128" y="148" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">(offline)</text>
        </svg>`,
        {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-store',
            },
        },
    );
};

const createPlaceholderImage = () => {
    return new Response(
        `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="200" fill="#e0e0e0" />
            <rect width="80" height="80" x="110" y="50" fill="#bbb" rx="8" />
            <path d="M135,85 L145,75 Q150,70 155,75 L165,85" stroke="#999" stroke-width="3" fill="none" />
            <circle cx="138" cy="78" r="5" fill="#999" />
            <path d="M110,130 L190,130 L190,150 L110,150 Z" fill="#bbb" />
            <text x="150" y="170" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">Story image unavailable</text>
            <text x="150" y="188" font-family="Arial" font-size="12" text-anchor="middle" fill="#888">(you are offline)</text>
        </svg>`,
        {
            status: 200,
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-store',
            },
        },
    );
};

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method !== 'GET') return;

    if (url.pathname.includes('/icons/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).catch(() => {
                    console.log('Failed to fetch icon, returning generic icon:', url.pathname);

                    return new Response(
                        `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
                            <rect width="144" height="144" fill="#4285f4" rx="12" />
                            <text x="72" y="80" font-family="Arial" font-size="48" text-anchor="middle" fill="white">App</text>
                        </svg>`,
                        {
                            status: 200,
                            headers: {
                                'Content-Type': 'image/svg+xml',
                                'Cache-Control': 'no-store',
                            },
                        },
                    );
                });
            }),
        );
        return;
    }

    if (
        url.pathname.includes('/images/default-story.jpg') ||
        url.pathname.includes('/default-story.jpg')
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).catch(() => createPlaceholderImage());
            }),
        );
        return;
    }

    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        const responseToCache = response.clone();
                        caches.open('openstreetmap-tiles').then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    })
                    .catch(() => {
                        console.log('Failed to fetch map tile, returning placeholder:', url.href);
                        return caches.match('/images/offline-map.svg').then((offlineResponse) => {
                            if (offlineResponse) {
                                return offlineResponse;
                            }
                            return createOfflineMapTile();
                        });
                    });
            }),
        );
        return;
    }

    if (url.href.includes('story-api.dicoding.dev/images/stories')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        if (response.ok) {
                            const responseToCache = response.clone();
                            caches.open('story-api-images').then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        console.log(
                            'Failed to fetch story image, returning placeholder:',
                            url.href,
                        );
                        return caches
                            .match('/images/placeholder-story.jpg')
                            .then((placeholderResponse) => {
                                if (placeholderResponse) {
                                    return placeholderResponse;
                                }
                                return createPlaceholderImage();
                            });
                    });
            }),
        );
        return;
    }

    if (
        url.href.includes('leaflet') &&
        (url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png'))
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        const responseToCache = response.clone();
                        caches.open('leaflet-resources').then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    })
                    .catch((error) => {
                        console.log('Failed to fetch leaflet resource:', url.href, error);
                        throw error;
                    });
            }),
        );
        return;
    }
});

self.addEventListener('push', (event) => {
    console.log('Push received:', event);

    let notificationData = {};
    try {
        notificationData = event.data.json();
        console.log(notificationData);
    } catch (e) {
        console.error('Error parsing push data:', e);
        notificationData = {
            title: 'New Notification',
            options: {
                body: event.data ? event.data.text() : 'No details available',
                icon: '/icons/128x128.ico',
            },
        };
    }

    console.log('Notification data:', notificationData);

    const { title, options } = notificationData;

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        }),
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'ONLINE_STATUS') {
        const isOnline = event.data.online;
        console.log('App connectivity status changed:', isOnline ? 'online' : 'offline');
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                const currentCaches = [
                    'google-fonts-stylesheets',
                    'google-fonts-webfonts',
                    'images',
                    'static-resources',
                    'api-responses',
                    'pages',
                    'openstreetmap-tiles',
                    'story-api-images',
                    'app-icons',
                    'leaflet-resources',
                ];

                return Promise.all(
                    cacheNames
                        .map((cacheName) => {
                            if (
                                !currentCaches.includes(cacheName) &&
                                !cacheName.includes('workbox-precache')
                            ) {
                                console.log('Deleting old cache:', cacheName);
                                return caches.delete(cacheName);
                            }
                            return null;
                        })
                        .filter(Boolean),
                );
            })
            .then(() => {
                console.log('Service Worker activated and claiming clients');
                return clients.claim();
            }),
    );
});
