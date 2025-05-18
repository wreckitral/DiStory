import { createStoryListTemplate } from '../../templates.js';
import { initMap, renderGeoJSON } from '../../utils/map.js';
import { getAccessToken } from '../../utils/auth.js';
import { VAPID_PUBLIC_KEY } from '../../config.js';

export default class HomePresenter {
    #view = null;
    #model = null;
    #map = null;

    constructor({ view, model }) {
        this.#view = view;
        this.#model = model;
    }

    async loadStories() {
        const response = await this.#model.getAllStories();

        if (response.error === false && Array.isArray(response.listStory)) {
            const formattedStories = response.listStory.map((story) => ({
                ...story,
                formattedDate: this.formatDate(story.createdAt),
            }));
            this.#view.showStories(formattedStories);

            this.initializeMap(formattedStories);
        } else {
            throw new Error(response.message || 'Failed to load stories');
        }
    }

    async initNotificationControls() {
        const enableBtn = document.getElementById('enable-notifications');
        const disableBtn = document.getElementById('disable-notifications');

        if (!navigator.serviceWorker.controller) {
            console.log('Service worker not controlling the page. Attempting to register...');
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service worker registered:', registration);

                await new Promise((resolve) => {
                    if (navigator.serviceWorker.controller) {
                        resolve();
                    } else {
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            resolve();
                        });
                    }
                });
            } catch (error) {
                console.error('Service worker registration failed:', error);
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message: 'Service worker registration failed. Push notifications may not work.',
                });
            }
        }

        await this.updateNotificationStatus();

        enableBtn.addEventListener('click', async () => {
            await this.enableNotifications();
        });

        disableBtn.addEventListener('click', async () => {
            await this.disableNotifications();
        });
    }

    areNotificationsSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    }

    async updateNotificationStatus() {
        try {
            this.#view.updateNotificationUIState({
                isLoading: true,
                message: 'Checking notification status...',
            });

            const permissionStatus = Notification.permission;
            console.log('Current notification permission:', permissionStatus);

            if (permissionStatus === 'denied') {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message:
                        'Notification permission denied. Please enable notifications in your browser settings.',
                });
                return;
            }

            const swRegistration = await navigator.serviceWorker.ready;
            console.log('Service worker ready:', swRegistration);

            const subscription = await swRegistration.pushManager.getSubscription();
            console.log('Current push subscription:', subscription);

            this.#view.updateNotificationUIState({
                isSupported: true,
                isSubscribed: !!subscription,
                message: subscription
                    ? 'You are subscribed to push notifications'
                    : 'Notifications not enabled',
            });
        } catch (error) {
            console.error('Error checking notification status:', error);
            this.#view.updateNotificationUIState({
                isSupported: true,
                isSubscribed: false,
                error: true,
                message: 'Error checking notification status: ' + error.message,
            });
        }
    }

    async requestNotificationPermission() {
        try {
            console.log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('Permission request result:', permission);
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    async enableNotifications() {
        try {
            const accessToken = getAccessToken();
            if (!accessToken) {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message: 'You need to be logged in to enable notifications',
                });
                return;
            }

            this.#view.updateNotificationUIState({
                isLoading: true,
                message: 'Setting up notifications...',
            });

            const hasPermission = await this.requestNotificationPermission();
            if (!hasPermission) {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message: 'Notification permission denied',
                });
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            console.log('Service worker registration for push:', registration);

            let subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                console.log('Existing subscription found, unsubscribing first');
                await subscription.unsubscribe();
            }

            subscription = await this.createPushSubscription(registration);

            if (!subscription) {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message: 'Failed to create push subscription',
                });
                return;
            }

            console.log('Created push subscription:', subscription);

            const p256dhKey = btoa(
                String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))),
            )
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const authKey = btoa(
                String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))),
            )
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const subscriptionObject = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: p256dhKey,
                    auth: authKey,
                },
            };

            console.log('Sending subscription to server:', subscriptionObject);

            const result = await this.#model.subscribeNotification(subscriptionObject);

            if (result.error) {
                console.error('Server subscription error:', result.message);
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    error: true,
                    message: result.message || 'Failed to register subscription with server',
                });
                return;
            }

            console.log('Successfully subscribed to push notifications:', result);

            this.#view.updateNotificationUIState({
                isSupported: true,
                isSubscribed: true,
                message: 'Successfully subscribed to push notifications!',
            });

            try {
                this.showTestNotification();
            } catch (notifError) {
                console.warn('Could not show test notification:', notifError);
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            this.#view.updateNotificationUIState({
                isSupported: true,
                isSubscribed: false,
                error: true,
                message: `Error enabling notifications: ${error.message || 'Unknown error'}`,
            });
        }
    }

    async showTestNotification() {
        if (Notification.permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('Notifications Enabled', {
                body: 'You will now receive updates for new stories!',
                icon: '/icons/128x128.ico',
                badge: '/icons/96x96.ico',
                vibrate: [100, 50, 100],
                tag: 'test-notification',
            });
        }
    }

    async disableNotifications() {
        try {
            this.#view.updateNotificationUIState({
                isLoading: true,
                message: 'Disabling notifications...',
            });

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: false,
                    message: 'No active subscription found',
                });
                return;
            }

            console.log('Unsubscribing from push notifications:', subscription);

            const endpoint = subscription.endpoint;

            const result = await this.#model.unsubscribeNotification(endpoint);

            if (result.error) {
                console.warn('Server unsubscribe warning:', result.message);
                console.log('Server unsubscribe successful');
            }

            const unsubscribed = await subscription.unsubscribe();

            if (!unsubscribed) {
                this.#view.updateNotificationUIState({
                    isSupported: true,
                    isSubscribed: true,
                    error: true,
                    message: 'Failed to unsubscribe locally. Try again or restart your browser.',
                });
                return;
            }

            console.log('Successfully unsubscribed locally');

            this.#view.updateNotificationUIState({
                isSupported: true,
                isSubscribed: false,
                message: 'Push notifications disabled',
            });
        } catch (error) {
            console.error('Error disabling notifications:', error);
            this.#view.updateNotificationUIState({
                isSupported: true,
                error: true,
                message: `Error disabling notifications: ${error.message || 'Unknown error'}`,
            });
        }
    }

    async createPushSubscription(registration) {
        try {
            const serverKey = VAPID_PUBLIC_KEY;

            if (!serverKey) {
                throw new Error('Could not retrieve server public key for push notifications');
            }

            console.log('Using application server key:', serverKey);

            const applicationServerKey = this.urlB64ToUint8Array(serverKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });

            return subscription;
        } catch (error) {
            console.error('Error creating push subscription:', error);
            return null;
        }
    }

    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    getStoryTemplate(story) {
        return createStoryListTemplate(story);
    }

    initializeMap(stories) {
        if (stories.length === 0) return;

        const mapContainer = document.getElementById('main-map-container');
        if (!mapContainer) return;

        this.#map = initMap('main-map-container');

        renderGeoJSON(this.#map, stories);

        const validStories = stories.filter((story) => story.lat && story.lon);

        if (validStories.length > 0) {
            const bounds = validStories.map((story) => [story.lat, story.lon]);

            this.#map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 13,
            });

            this.#map.eachLayer((layer) => {
                if (layer.feature) {
                    const original = layer.getPopup().getContent();

                    const markerLngLat = layer.feature.geometry.coordinates;
                    const story = stories.find(
                        (s) => s.lon === markerLngLat[0] && s.lat === markerLngLat[1],
                    );

                    if (story) {
                        const newContent =
                            original +
                            `<button class="map-navigate-btn" data-story-id="${story.id}">View Story</button>`;
                        layer.getPopup().setContent(newContent);

                        layer.on('popupopen', () => {
                            const btn = document.querySelector(
                                `.map-navigate-btn[data-story-id="${story.id}"]`,
                            );
                            if (btn) {
                                btn.addEventListener('click', () => {
                                    this.navigateToStoryDetail(story.id);
                                });
                            }
                        });
                    }
                }
            });
        } else {
            this.#map.setView([-2.5489, 118.0149], 5);
        }
    }

    navigateToStoryDetail(storyId) {
        window.location.href = `#/detail-story/${storyId}`;
    }
}
