import pauseBtnURL from './pause-btn.svg';
import playBtnURL from './play-btn.svg';
import saveBtnURL from './save.svg';
import cancelBtnURL from './x-circle.svg';

const OUTLET_ID = 'outlet'
const PLAY_PAUSE_BTN_ID = 'play-pause';
const CANCEL_BTN_ID = 'cancel';
const SAVE_BTN_ID = 'save';
const LAST_COORDS_KEY = 'last-coords';

var outletDiv;
var video;
var photoImg;
var pausePlayButton;
var saveButton;
var cancelButton;
var canvasImgBlob;

function backToLocator() {
    const url = '/index.html';
    console.debug(`navigate to ${url}`);
    window.location.href = url;
}

function saveAndExit() {
    console.debug('saveAndExit');
    const ll = JSON.parse(localStorage.getItem(LAST_COORDS_KEY));
    const reader = new FileReader();
    reader.onloadend = function () {
        localStorage.setItem(`${ll[0]}x${ll[1]}`, reader.result);
        backToLocator();
    };
    reader.readAsDataURL(canvasImgBlob);
}

function takePicture() {
    //change state
    pausePlayButton.src = playBtnURL;
    pausePlayButton.onclick = restartVideo;

    saveButton.disabled = false;

    const width = video.offsetWidth;
    const height = video.offsetHeight;
    console.debug(`video's dimensions: w:${width}, h:${height}`);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);

    //draw text into image
    const ll = JSON.parse(localStorage.getItem(LAST_COORDS_KEY));
    context.font = '12pt monospace';
    const text = `${ll[0]} x ${ll[1]}`;
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


    canvas.convertToBlob({ type: 'image/jpeg' }).then(
        (blob) => {
            canvasImgBlob = blob;
            const imageData = URL.createObjectURL(blob);
            photoImg.width = width;
            photoImg.height = height;
            photoImg.src = imageData;

            //put image on page
            outletDiv.removeChild(video);
            outletDiv.appendChild(photoImg);
        }
    );
}

function startVideoPlayback() {
    pausePlayButton.src = pauseBtnURL;
    pausePlayButton.disabled = true;
    pausePlayButton.onclick = takePicture;

    saveButton.disabled = true;

    //initiate video playback
    navigator.mediaDevices
        .getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        })
        .then((stream) => {
            video.srcObject = stream;
            video.play();
        })
        .catch((err) => {
            console.error(`An error occurred: ${err}`);
        });
}

function videoIsPlaying(event) {
    pausePlayButton.disabled = false;
}

function restartVideo() {
    //put video on page
    outletDiv.removeChild(photoImg);
    outletDiv.appendChild(video);

    startVideoPlayback();
}

window.onload = () => {
    //init global element references
    outletDiv = document.getElementById(OUTLET_ID);
    pausePlayButton = document.getElementById(PLAY_PAUSE_BTN_ID);
    saveButton = document.getElementById(SAVE_BTN_ID);
    cancelButton = document.getElementById(CANCEL_BTN_ID);

    //create video element
    video = document.createElement('video');
    video.textContent = 'Video stream not available.';
    video.setAttribute('muted', true);
    video.setAttribute('autoplay', true);
    video.setAttribute('playsinline', true);
    video.oncanplay = videoIsPlaying;
    //and place it on the page
    outletDiv.appendChild(video);

    //create image element
    photoImg = document.createElement('img');

    //setup other UI elements
    saveButton.src = saveBtnURL;
    saveButton.onclick = saveAndExit;
    cancelButton.src = cancelBtnURL;
    cancelButton.onclick = backToLocator;

    startVideoPlayback();
}