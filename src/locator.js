import arrowUpImage from './arrow-up-circle.svg';
import cameraImage from './camera.svg';

const COORD_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6, minimumIntegerDigits: 3, style: 'unit', unit: 'degree' });
const DIST_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'meter' });
const DEG_FORMATTER = Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'unit', unit: 'degree' });

const LOCATION_LEFT_ID = 'location-left';
const LOCATION_MIDDLE_ID = 'location-middle';
const CAMERA_INPUT_ID = 'camera';

const LAST_COORDS_KEY = 'last-coords';

//map state
var map;
var ranger;
var headingMarker;
var headingImage;

/* Geolocation service */
var geo;
var watcherId;

function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

function configureMap(latLngArray) {
    map = L.map('map').setView(latLngArray, 17);
    if (isTouchDevice()) {
        map.removeControl(map.zoomControl);
    }
    map.attributionControl.setPosition('bottomleft');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    ranger = L.circle(latLngArray, { radius: 100.0 }).addTo(map);

    headingImage = new Image(31, 31);
    headingImage.src = arrowUpImage;
    const headingIcon = L.divIcon({ html: headingImage, iconSize: [31, 31], className: '' });
    headingMarker = L.marker([0, 0], { icon: headingIcon });
}

function updatePosition(position, zoom) {
    const locatorLeftDiv = document.getElementById(LOCATION_LEFT_ID);
    const locatorMiddleDiv = document.getElementById(LOCATION_MIDDLE_ID);
    const cameraButton = document.getElementById(CAMERA_INPUT_ID);

    const coords = position.coords;
    const ll = [coords.latitude, coords.longitude];

    console.debug(`got new coordinates: ${ll}`);

    localStorage.setItem(LAST_COORDS_KEY, JSON.stringify(ll));

    locatorLeftDiv.innerHTML = `
        <dl>
            <dt>LAT</dt>
            <dd>${COORD_FORMATTER.format(coords.latitude)}</dd>
            <dt>LONG</dt>
            <dd>${COORD_FORMATTER.format(coords.longitude)}</dd>
            <dt>ALT</dt>
            <dd>${coords.altitude ? DIST_FORMATTER.format(coords.altitude) : '-'}</dd>
        </dl>`;
    locatorMiddleDiv.innerHTML = `
        <dl>
            <dt>ACC</dt>
            <dd>${DIST_FORMATTER.format(coords.accuracy)}</dd>
            <dt>HEAD</dt>
            <dd>${coords.heading ? DEG_FORMATTER.format(coords.heading) : '-'}</dd>
            <dt>SPD</dt>
            <dd>${coords.speed ? DIST_FORMATTER.format(coords.speed) : '-'}</dd>
        </dl>`;

    if (zoom) {
        map.setView(ll, zoom);
    } else {
        map.setView(ll);
    }
    ranger.setLatLng(ll);
    ranger.setRadius(coords.accuracy);
    if (coords.heading) {
        headingMarker.setLatLng(ll).addTo(map);
        headingImage.style.transform = `rotate(${coords.heading}deg)`;
    } else {
        headingMarker.removeFrom(map);
    }

    //activate camera button
    cameraButton.disabled = false;
}

function openCamera(event) {
    const url = `/camera.html`;
    console.debug(`navigating to: ${url}`);
    window.location.href = url;
}

function logError(err) {
    console.error(err.message);
}

/* setup component */
window.onload = () => {
    const cameraButton = document.getElementById(CAMERA_INPUT_ID);

    //setup UI
    cameraButton.src = cameraImage;
    cameraButton.onclick = openCamera;

    //init leaflet
    const ll = JSON.parse(localStorage.getItem(LAST_COORDS_KEY));
    if (ll) {
        configureMap(ll)
    } else {
        //take FHV position as default
        configureMap([47.406653, 9.744844]);
    }

    // setup service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(
            new URL('serviceworker.js', import.meta.url),
            { type: 'module' }
        ).then(() => {
            console.log('Service worker registered!');
        }).catch((error) => {
            console.warn('Error registering service worker:');
            console.warn(error);
        });
    }

    /* register callbacks to Geolocation service */
    if ('geolocation' in navigator) {
        geo = navigator.geolocation;
        geo.getCurrentPosition((p) => updatePosition(p, 17), logError);
        watcherId = geo.watchPosition((p) => updatePosition(p), logError, { enableHighAccuracy: true, maximumAge: 10000 });
    } else {
        locatorDiv.innerHTML = 'Geolocation is not available.'
    }

}

window.onbeforeunload = () => {
    if (geo) {
        console.debug(`will clear the watcher ${watcherId}`);
        geo.clearWatch(watcherId);
    }
}
