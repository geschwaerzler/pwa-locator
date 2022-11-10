import { manifest, version } from '@parcel/service-worker';
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(
    manifest.map(urlPath => {
        return {
            url: urlPath,
            revision: urlPath.endsWith('.html') || urlPath.endsWith('.json') ? version : null
        };
    }),
    {
        // Ignore URL all parameters
        ignoreURLParametersMatching: [/.*/],
    }
);
