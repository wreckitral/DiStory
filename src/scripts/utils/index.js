export function sleep(time = 1000) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export function showFormattedDate(date, locale = 'en-US', options = {}) {
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    });
}

export async function createCarousel(containerElement, options = {}) {
    const { tns } = await import('tiny-slider');

    return tns({
        container: containerElement,
        mouseDrag: true,
        swipeAngle: false,
        speed: 600,

        nav: true,
        navPosition: 'bottom',

        autoplay: false,
        controls: false,

        ...options,
    });
}

/**
 * Ref: https://stackoverflow.com/questions/18650168/convert-blob-to-base64
 */
export function convertBlobToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Ref: https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 */
export function convertBase64ToBlob(base64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

export function convertBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function setupSkipToContent(element, mainContent) {
    element.addEventListener('click', () => mainContent.focus());
}

export const registerServiceWorker = async () => {
    // Register service worker only in production and if browser supports it
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service worker registered successfully:', registration);

            // Optional: Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('Service worker update found!');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker is installed, but waiting
                        console.log('New service worker installed, but waiting.');

                        // Optional: Show update notification to user
                        if (confirm('New version available! Update now?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                        }
                    }
                });
            });

            // Optional: Handle controller change (when skipWaiting() is called)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            return registration;
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    } else {
        console.log('Service workers are not supported in this browser.');
    }
};
