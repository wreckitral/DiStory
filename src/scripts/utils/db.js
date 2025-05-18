import { openDB } from 'idb';

const DB_NAME = 'distory-db';
const DB_VERSION = 1;
const STORIES_STORE = 'stories';
const FAVORITES_STORE = 'favorites';

// Use a module-level variable to cache the DB connection
let dbPromise = null;

// Initialize the database connection once
const initializeDB = async () => {
    if (!dbPromise) {
        console.log('Initializing IndexedDB connection');
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                console.log('Upgrading IndexedDB schema to version', DB_VERSION);
                // Create a store of objects
                if (!db.objectStoreNames.contains(STORIES_STORE)) {
                    const storyStore = db.createObjectStore(STORIES_STORE, {
                        keyPath: 'id',
                    });
                    storyStore.createIndex('by-date', 'createdAt');
                    console.log('Created stories store');
                }
                if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
                    db.createObjectStore(FAVORITES_STORE, {
                        keyPath: 'id',
                    });
                    console.log('Created favorites store');
                }
            },
        });
    }
    return dbPromise;
};

// Initialize the connection when this module is imported
initializeDB().catch((err) => console.error('Failed to initialize database:', err));

// Helper function to get the DB instance
const getDB = async () => {
    return dbPromise || initializeDB();
};

// Stories operations
export const saveStories = async (stories) => {
    console.log('Saving multiple stories to IndexedDB:', stories.length);
    try {
        const db = await getDB();
        const tx = db.transaction(STORIES_STORE, 'readwrite');

        // Validate each story before saving
        const validStories = stories.filter((story) => {
            if (!story.id) {
                console.warn('Skipping story without id:', story);
                return false;
            }
            return true;
        });

        await Promise.all([
            ...validStories.map((story) => {
                console.log(`Saving story ${story.id} to IndexedDB`);
                return tx.store.put(story);
            }),
            tx.done,
        ]);

        console.log('Successfully saved stories to IndexedDB');
        return true;
    } catch (error) {
        console.error('Error saving stories to IndexedDB:', error);
        return false;
    }
};

export const saveStory = async (story) => {
    // Validate story object
    if (!story || !story.id) {
        console.error('Cannot save story without ID:', story);
        throw new Error('Story must have an ID to be saved');
    }

    console.log(`Saving story to IndexedDB: ${story.id}`);
    try {
        const db = await getDB();
        await db.put(STORIES_STORE, story);
        console.log(`Successfully saved story ${story.id} to IndexedDB`);
        return true;
    } catch (error) {
        console.error(`Error saving story ${story.id} to IndexedDB:`, error);
        throw error;
    }
};

export const getAllStoriesFromDB = async () => {
    console.log('Getting all stories from IndexedDB');
    try {
        const db = await getDB();
        const stories = await db.getAll(STORIES_STORE);
        console.log(`Retrieved ${stories.length} stories from IndexedDB`);
        return stories;
    } catch (error) {
        console.error('Error getting stories from IndexedDB:', error);
        return [];
    }
};

export const getStoryById = async (id) => {
    console.log(`Getting story ${id} from IndexedDB`);
    try {
        const db = await getDB();
        const story = await db.get(STORIES_STORE, id);
        console.log(`Story ${id} found:`, !!story);
        return story;
    } catch (error) {
        console.error(`Error getting story ${id} from IndexedDB:`, error);
        return null;
    }
};

export const deleteStory = async (id) => {
    console.log(`Deleting story ${id} from IndexedDB`);
    try {
        const db = await getDB();
        await db.delete(STORIES_STORE, id);
        console.log(`Successfully deleted story ${id} from IndexedDB`);
        return true;
    } catch (error) {
        console.error(`Error deleting story ${id} from IndexedDB:`, error);
        throw error;
    }
};

// Favorites operations
export const saveFavorite = async (story) => {
    // Validate story object
    if (!story || !story.id) {
        console.error('Cannot save favorite without story ID:', story);
        throw new Error('Story must have an ID to be saved as favorite');
    }

    console.log(`Saving favorite story ${story.id} to IndexedDB`);
    try {
        const db = await getDB();
        await db.put(FAVORITES_STORE, {
            ...story,
            favoriteAt: new Date().toISOString(),
        });
        console.log(`Successfully saved favorite story ${story.id} to IndexedDB`);
        return true;
    } catch (error) {
        console.error(`Error saving favorite story ${story.id} to IndexedDB:`, error);
        throw error;
    }
};

export const getAllFavorites = async () => {
    console.log('Getting all favorites from IndexedDB');
    try {
        const db = await getDB();
        const favorites = await db.getAll(FAVORITES_STORE);
        console.log(`Retrieved ${favorites.length} favorites from IndexedDB`);
        return favorites;
    } catch (error) {
        console.error('Error getting favorites from IndexedDB:', error);
        return [];
    }
};

export const removeFavorite = async (id) => {
    console.log(`Removing favorite ${id} from IndexedDB`);
    try {
        const db = await getDB();
        await db.delete(FAVORITES_STORE, id);
        console.log(`Successfully removed favorite ${id} from IndexedDB`);
        return true;
    } catch (error) {
        console.error(`Error removing favorite ${id} from IndexedDB:`, error);
        throw error;
    }
};

export const isFavorite = async (id) => {
    console.log(`Checking if story ${id} is a favorite`);
    try {
        const db = await getDB();
        const story = await db.get(FAVORITES_STORE, id);
        const result = !!story;
        console.log(`Story ${id} is${result ? '' : ' not'} a favorite`);
        return result;
    } catch (error) {
        console.error(`Error checking if story ${id} is a favorite:`, error);
        return false;
    }
};

// Clear the entire IndexedDB store
export const clearStories = async () => {
    console.log('Clearing all stories from IndexedDB');
    try {
        const db = await getDB();
        const tx = db.transaction(STORIES_STORE, 'readwrite');
        await tx.store.clear();
        await tx.done;
        console.log('Successfully cleared all stories from IndexedDB');
        return true;
    } catch (error) {
        console.error('Error clearing stories from IndexedDB:', error);
        throw error;
    }
};

export const clearFavorites = async () => {
    console.log('Clearing all favorites from IndexedDB');
    try {
        const db = await getDB();
        const tx = db.transaction(FAVORITES_STORE, 'readwrite');
        await tx.store.clear();
        await tx.done;
        console.log('Successfully cleared all favorites from IndexedDB');
        return true;
    } catch (error) {
        console.error('Error clearing favorites from IndexedDB:', error);
        throw error;
    }
};

// Debug helper for console use
if (typeof window !== 'undefined') {
    window.debugDB = {
        checkStories: getAllStoriesFromDB,
        checkFavorites: getAllFavorites,
        clearStories,
        clearFavorites,
    };
    console.log('DB debugging helpers available at window.debugDB');
}
