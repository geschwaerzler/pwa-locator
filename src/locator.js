import markerPath2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerPath from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import arrowUpImage from './arrow-up-circle.svg';
import cameraImage from './camera.svg';

const COORD_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6, minimumIntegerDigits: 3, style: 'unit', unit: 'degree' });
const URL_FORMATTER = Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const DIST_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'meter' });
const DEG_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'degree' });

const LOCATOR_ID = 'location';
const CAMERA_INPUT_ID = 'camera';

const locatorDiv = document.getElementById(LOCATOR_ID);
const cameraButton = document.getElementById(CAMERA_INPUT_ID);

//map state
var map;
var ranger;
var headingMarker;
var headingImage;

function configureMap(latLngArray) {
    let radius = 100.0;

    if (!latLngArray) {
        latLngArray = [0, 0];
        radius = 1000000;
        map = L.map('map').fitWorld();
    } else {
        map = L.map('map').setView(latLngArray, 17);
    }
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    ranger = L.circle(latLngArray, { radius: radius }).addTo(map);

    headingImage = new Image(31, 31);
    headingImage.src = arrowUpImage;
    const headingIcon = L.divIcon({ html: headingImage, iconSize: [31, 31], className: '' });
    headingMarker = L.marker([0, 0], { icon: headingIcon }).addTo(map);

    const markerIcon = new L.Icon.Default({
        iconUrl: markerPath,
        iconRetinaUrl: markerPath2x,
        shadowUrl: markerShadow
    });

    /* set markers */
    for (var i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const lngLat = key.split('x');
        const marker = L.marker([Number(lngLat[1]), Number(lngLat[0])], { icon: markerIcon }).addTo(map);
        marker.bindPopup((layer) => {
            const photo = document.createElement('img');
            photo.width = 160;
            photo.src = localStorage.getItem(key);
            return photo;
        });
    }
}

let currentCoords = null;

function updatePosition(coords, zoom) {
    console.debug(`got new coordinates: ${coords}`);
    locatorDiv.innerHTML = `
        <dl>
            <dt>lat</dt>
            <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
            <dt>long</dt>
            <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
            <dt>alt</dt>
            <dd>${coords.altitude ? DIST_FORMATTER.format(coords.altitude) : '-'}</dd>
            <dt>accuracy</dt>
            <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
            <dt>heading</dt>
            <dd>${coords.heading ? DEG_FORMATTER.format(coords.heading) : '-'}</dd>
            <dt>speed</dt>
            <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : '-'}</dd>
        </dl>
    `;
    var ll = [coords.latitude, coords.longitude];
    if (zoom) {
        map.setView(ll, zoom);
    } else {
        map.setView(ll);
    }
    ranger.setLatLng(ll);
    ranger.setRadius(coords.accuracy);
    headingMarker.setLatLng(ll);
    headingImage.style.transform = `rotate(${30}deg)`;
    cameraButton.disabled = false;
    currentCoords = coords;
}

function logError(err) {
    console.error(err.message);
}

function openCamera(event) {
    console.debug('open camera');
    const p = currentCoords;
    const url = `/camera.html?lng=${URL_FORMATTER.format(p.longitude)}&lat=${URL_FORMATTER.format(p.latitude)}`;
    console.debug(`navigating to: ${url}`);
    window.location.href = url;
}

/* setup component */
const queryParams = new URLSearchParams(window.location.search);
if (queryParams.has('lat') && queryParams.has('lng')) {
    console.debug(`we have query params: ${window.location.search}`);
    const latitude = Number(queryParams.get('lat'));
    const longitude = Number(queryParams.get('lng'));
    if (!Number.isNaN(longitude) && !Number.isNaN(latitude)) {
        console.debug(`we returned to lat: ${latitude}, lng: ${longitude}`);
        configureMap([latitude, longitude]);
    } else {
        configureMap();
    }
} else {
    configureMap();
}

/* register callbacks to Geolocation service */
var geo;
var watcherId;
if ('geolocation' in navigator) {
    geo = navigator.geolocation;
    geo.getCurrentPosition((p) => updatePosition(p.coords, 17), logError);
    watcherId = geo.watchPosition((p) => updatePosition(p.coords), logError, { enableHighAccuracy: true, maximumAge: 10000 });
} else {
    locatorDiv.innerHTML = 'Geolocation is not available.'
}

/* event handlers */
cameraButton.src = cameraImage;
cameraButton.onclick = openCamera;
document.addEventListener('beforeunload', (event) => {
    console.debug('got beforeunload event');
    if (geo) {
        geo.clearWatch(watcherId);
    }
});

/* setup service worker, as soon as document has been loaded */
window.addEventListener('load', () => {
    // Is service worker available?
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(
            new URL('sw.js', import.meta.url),
            { type: 'module' }
        ).then(() => {
            console.log('Service worker registered!');
        }).catch((error) => {
            console.warn('Error registering service worker:');
            console.warn(error);
        });
    }
});