import { manifest, version } from '@parcel/service-worker';
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(
    manifest.map(urlPath => {
        if (urlPath.endsWith('.html')) {
            return { url: urlPath, revision: version };
        } else {
            //other assets have a revision hash in the path
            return { url: urlPath };
        }
    })
);
