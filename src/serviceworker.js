import { manifest } from '@parcel/service-worker';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { imageCache, pageCache, staticResourceCache } from 'workbox-recipes';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

console.debug(`serviceworker.js got manifest: ${manifest}`);

self.__WB_DISABLE_DEV_LOGS = true;

const tileCache = new CacheFirst({
    cacheName: 'tile-cache',
    plugins: [
        new CacheableResponsePlugin({
            statuses: [0, 200],
        }),
        new ExpirationPlugin({
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxEntries: 100,
        }),
    ],
});

registerRoute(
    ({ url }) => url.hostname === 'tile.openstreetmap.org',
    tileCache
);

// Set up caches using workbox recipes
pageCache({
    warmCache: manifest.filter(urlPath => /\.(html)/.test(urlPath))
});
staticResourceCache({
    warmCache: manifest.filter(urlPath => /\.(css|js)/.test(urlPath))
});
imageCache({
    warmCache: manifest.filter(urlPath =>
        !urlPath.startsWith('/locator') && /\.(png|svg)/.test(urlPath))
});
