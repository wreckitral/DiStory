import { getAccessToken } from '../utils/auth';
import { BASE_URL } from '../config';
import * as db from '../utils/db';

const ENDPOINTS = {
    // Auth
    REGISTER: `${BASE_URL}/register`,
    LOGIN: `${BASE_URL}/login`,
    // Stories
    ALL_STORIES: `${BASE_URL}/stories`,
    CREATE_STORY: `${BASE_URL}/stories`,
    // Notifications
    SUBSCRIBE_NOTIFICATION: `${BASE_URL}/notifications/subscribe`,
    UNSUBSCRIBE_NOTIFICATION: `${BASE_URL}/notifications/subscribe`,
    // Add endpoint to get VAPID public key - important for web push
    GET_PUSH_PUBLIC_KEY: `${BASE_URL}/notifications/vapid-public-key`,
};

// Helper function to handle offline mode for GET requests
const handleOfflineGet = async (endpoint, storageKey) => {
    try {
        const accessToken = getAccessToken();
        const fetchResponse = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const json = await fetchResponse.json();

        // If fetch was successful, store the data in IndexedDB
        if (json.error === false) {
            if (json.listStory) {
                if (Array.isArray(json.listStory)) {
                    await db.saveStories(json.listStory);
                } else {
                    await db.saveStory(json.listStory);
                }
            }
        }

        return {
            ...json,
            ok: fetchResponse.ok,
            source: 'network',
        };
    } catch (error) {
        console.warn(
            `Network error when fetching ${endpoint}, falling back to offline data`,
            error,
        );

        // Fall back to IndexedDB data
        try {
            const offlineData = await db.getAllStoriesFromDB();
            return {
                error: false,
                message: 'Retrieved from offline storage',
                listStory: offlineData,
                ok: true,
                source: 'cache',
            };
        } catch (dbError) {
            console.error('Failed to retrieve data from offline storage', dbError);
            throw new Error('Unable to fetch data. Please check your connection and try again.');
        }
    }
};

export async function getRegistered({ name, email, password }) {
    const data = JSON.stringify({ name, email, password });
    try {
        const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
        });
        const json = await fetchResponse.json();
        return {
            ...json,
            ok: fetchResponse.ok,
        };
    } catch (error) {
        console.error('Registration failed', error);
        return {
            error: true,
            message: 'Network error. Please check your connection and try again.',
            ok: false,
        };
    }
}

export async function getLogin({ email, password }) {
    const data = JSON.stringify({ email, password });
    try {
        const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
        });
        const json = await fetchResponse.json();
        return {
            ...json,
            ok: fetchResponse.ok,
        };
    } catch (error) {
        console.error('Login failed', error);
        return {
            error: true,
            message: 'Network error. Please check your connection and try again.',
            ok: false,
        };
    }
}

export async function getAllStories() {
    return handleOfflineGet(ENDPOINTS.ALL_STORIES, 'stories');
}

export async function getStoryById(id) {
    if (!navigator.onLine) {
        try {
            const story = await db.getStoryById(id);
            return {
                error: false,
                message: 'Retrieved from offline storage',
                data: story,
                ok: true,
                source: 'cache',
            };
        } catch (error) {
            console.error('Failed to retrieve story from offline storage', error);
            return {
                error: true,
                message: 'Story not available offline',
                ok: false,
            };
        }
    }

    try {
        const accessToken = getAccessToken();
        const fetchResponse = await fetch(`${ENDPOINTS.ALL_STORIES}/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const json = await fetchResponse.json();

        // Store the fetched story in IndexedDB for offline access
        if (json.story) {
            await db.saveStory(json.story);
        }

        return {
            ...json,
            ok: fetchResponse.ok,
            source: 'network',
        };
    } catch (error) {
        console.error(`Failed to fetch story id ${id}`, error);

        // Fall back to IndexedDB if we have the story cached
        try {
            const story = await db.getStoryById(id);
            if (story) {
                return {
                    error: false,
                    message: 'Retrieved from offline storage',
                    data: story,
                    ok: true,
                    source: 'cache',
                };
            }
        } catch (dbError) {
            console.error('Failed to retrieve story from offline storage', dbError);
        }

        return {
            error: true,
            message: 'Failed to load story. Please check your connection and try again.',
            ok: false,
        };
    }
}

export async function createStory(formData) {
    // For create operations, we don't have offline support
    // as they require server-side processing
    if (!navigator.onLine) {
        return {
            error: true,
            message: 'You are offline. Please connect to the internet to create a story.',
            ok: false,
        };
    }

    try {
        const accessToken = getAccessToken();
        const fetchResponse = await fetch(ENDPOINTS.CREATE_STORY, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });

        const json = await fetchResponse.json();

        // Store the newly created story in IndexedDB
        if (json.data) {
            await db.saveStory(json.data);
        }

        return {
            ...json,
            ok: fetchResponse.ok,
        };
    } catch (error) {
        console.error('Failed to create story', error);
        return {
            error: true,
            message: 'Failed to create story. Please check your connection and try again.',
            ok: false,
        };
    }
}

// NOTIFICATION
export async function subscribeNotification(subscription) {
    if (!navigator.onLine) {
        return {
            error: true,
            message:
                'You are offline. Push notification subscription requires internet connection.',
            ok: false,
        };
    }

    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return {
                error: true,
                message: 'Authentication required. Please log in to subscribe to notifications.',
                ok: false,
            };
        }

        // Log the subscription being sent for debugging
        console.log('Sending subscription to server:', JSON.stringify(subscription));

        const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(subscription),
        });

        const json = await fetchResponse.json();

        // Check both HTTP status and API error field
        if (!fetchResponse.ok || json.error === true) {
            return {
                error: true,
                message: json.message || `Server error: ${fetchResponse.status}`,
                ok: false,
            };
        }

        // Store subscription in local storage for reference
        try {
            localStorage.setItem(
                'pushSubscription',
                JSON.stringify({
                    endpoint: subscription.endpoint,
                    timestamp: new Date().toISOString(),
                }),
            );
        } catch (storageError) {
            console.warn('Could not store push subscription reference', storageError);
        }

        return {
            ...json,
            ok: true,
        };
    } catch (error) {
        console.error('Failed to subscribe to notifications', error);
        return {
            error: true,
            message:
                error.message || 'Failed to subscribe to notifications. Please try again later.',
            ok: false,
        };
    }
}

export async function unsubscribeNotification(endpoint) {
    if (!navigator.onLine) {
        return {
            error: true,
            message:
                'You are offline. Unsubscribing from notifications requires internet connection.',
            ok: false,
        };
    }

    try {
        const accessToken = getAccessToken();
        if (!accessToken) {
            return {
                error: true,
                message:
                    'Authentication required. Please log in to unsubscribe from notifications.',
                ok: false,
            };
        }

        // Log for debugging
        console.log('Unsubscribing endpoint:', endpoint);

        const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE_NOTIFICATION, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ endpoint }),
        });

        const json = await fetchResponse.json();

        // Check both HTTP status and API error field
        if (!fetchResponse.ok || json.error === true) {
            return {
                error: true,
                message: json.message || `Server error: ${fetchResponse.status}`,
                ok: false,
            };
        }

        // Clear subscription from local storage
        localStorage.removeItem('pushSubscription');

        return {
            ...json,
            ok: true,
        };
    } catch (error) {
        console.error('Failed to unsubscribe from notifications', error);
        return {
            error: true,
            message:
                error.message ||
                'Failed to unsubscribe from notifications. Please try again later.',
            ok: false,
        };
    }
}

// Favorites management
export async function addToFavorites(story) {
    try {
        await db.saveFavorite(story);
        return {
            error: false,
            message: 'Story added to favorites',
            ok: true,
        };
    } catch (error) {
        console.error('Failed to add story to favorites', error);
        return {
            error: true,
            message: 'Failed to add story to favorites',
            ok: false,
        };
    }
}

export async function removeFromFavorites(storyId) {
    try {
        await db.removeFavorite(storyId);
        return {
            error: false,
            message: 'Story removed from favorites',
            ok: true,
        };
    } catch (error) {
        console.error('Failed to remove story from favorites', error);
        return {
            error: true,
            message: 'Failed to remove story from favorites',
            ok: false,
        };
    }
}

export async function getFavorites() {
    try {
        const favorites = await db.getAllFavorites();
        return {
            error: false,
            message: 'Retrieved favorites from storage',
            data: favorites,
            ok: true,
        };
    } catch (error) {
        console.error('Failed to get favorites', error);
        return {
            error: true,
            message: 'Failed to retrieve favorites',
            ok: false,
        };
    }
}

export async function checkIsFavorite(storyId) {
    try {
        const isFavorite = await db.isFavorite(storyId);
        return {
            error: false,
            data: isFavorite,
            ok: true,
        };
    } catch (error) {
        console.error('Failed to check if story is a favorite', error);
        return {
            error: true,
            message: 'Failed to check favorite status',
            ok: false,
        };
    }
}
