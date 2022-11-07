import pauseBtnURL from './pause-btn.svg';
import saveURL from './save.svg';
import xCircleURL from './x-circle.svg';

const VIDEO_ID = 'video';
const VIDEO_DIV_ID = 'video-container';
const SHOOT_ID = 'play-pause';
const SAVE_ID = 'save';
const CANCEL_ID = 'cancel';
const CANVAS_ID = 'canvas';
const PHOTO_IMG_ID = 'photo';
const PHOTO_DIV_ID = 'img-container';

const VIDEO_MODE_CLASS = 'video-mode';
const PHOTO_MODE_CLASS = 'photo-mode';

let width = 320;    // We will scale the photo width to this
let height = 0;     // This will be computed based on the input stream

let streaming = false;  //flag to do a 1st-time init

//page elements
let video = null;
let videoContainer = null;
let canvas = null;
let photoImg = null;
let photoImgContainer = null;

const pausePlayButton = document.getElementById(SHOOT_ID);
const saveButton = document.getElementById(SAVE_ID);
const cancelButton = document.getElementById(CANCEL_ID);

let imageData = null;   //data of last captured photo

function clearPhoto() {
    const context = canvas.getContext('2d');
    context.fillStyle = "#222";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL('image/png');
    photoImg.setAttribute('src', data);
}

function takePicture(event) {
    const context = canvas.getContext('2d');
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        //draw text into image
        const queryParams = new URLSearchParams(window.location.search);
        context.font = '12pt monospace';
        const text = `${queryParams.get('lng')} x ${queryParams.get('lat')}`;
        const textWidth = context.measureText(text).width;
        const tHalf = textWidth / 2;
        const wHalf = width / 2;
        //transparent background
        context.fillStyle = 'rgba(255, 255, 0, 0.5)';
        context.fillRect(wHalf - tHalf - 2, height - 20 + 2, textWidth + 2, 20 - 4);
        //text
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(text, wHalf, height - 4, textWidth);

        imageData = canvas.toDataURL('image/png');
        photo.setAttribute('src', imageData);

        //switch to image display
        document.body.className = PHOTO_MODE_CLASS;

        saveButton.disabled = false;
        saveButton.src = saveURL;

        pausePlayButton.onclick = cancelPicture;
    } else {
        clearPhoto();
    }
    event.preventDefault();
}

function backToLocator() {
    const url = `/index.html${window.location.search}`;
    console.debug(`navigate to ${url}`);
    imageData = null;
    window.location.href = url;
}

function saveAndExit(event) {
    console.debug('saveAndExit');
    const queryParams = new URLSearchParams(window.location.search);
    localStorage.setItem(`${queryParams.get('lng')}x${queryParams.get('lat')}`, imageData);
    backToLocator();
}

function cancelPicture(event) {
    imageData = null;

    //switch to image display
    document.body.className = VIDEO_MODE_CLASS;
    saveButton.disabled = true;

    pausePlayButton.src = pauseBtnURL;
    pausePlayButton.onclick = takePicture;
}

function startup() {
    video = document.getElementById(VIDEO_ID);
    canvas = document.getElementById(CANVAS_ID);
    photoImg = document.getElementById(PHOTO_IMG_ID);

    //start video playback
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
        });

    //further initializations as soon as a video stream appears
    video.addEventListener('canplay', (ev) => {
        //perform a one-time adjustment of video's and photo's aspect ratio
        if (!streaming) {
            height = video.videoHeight / video.videoWidth * width;
            if (isNaN(height)) {
                height = width * 3.0 / 4.0;
            }

            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            streaming = true;
        }
        pausePlayButton.onclick = takePicture;
        pausePlayButton.src = pauseBtnURL;

        saveButton.onclick = saveAndExit;
    }, false);

    clearPhoto();
}

/* set up buttons initial state */
cancelButton.src = xCircleURL;
cancelButton.onclick = (e) => backToLocator();
saveButton.src = saveURL;
pausePlayButton.src = pauseBtnURL;

window.addEventListener('load', startup, false);