import * as vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision";
import { playerJump } from "./player.js"
import { poolState } from "./states.js"

const { FaceLandmarker, FilesetResolver } = vision;
const videoBlendShapes = document.getElementById("video-blend-shapes");

let faceLandmarker;
let runningMode = "VIDEO";
let webcamRunning = false;

async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU",
      useGpu: true
    },
    outputFaceBlendshapes: true,
    enableFaceGeometry: false,
    refineLandmarks: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    runningMode,
    numFaces: 1,
    maxNumFaces: 1,
    useGpu: true
  });
  console.log('loaded model')
}
createFaceLandmarker();

const video = document.getElementById("webcam");

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  startbtn.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    startbtn.style.opacity = 1
    webcamConnected.style.opacity = 0
  } else {
    webcamRunning = true;
    startbtn.style.opacity = 0
    webcamConnected.style.opacity = 1
  }

  const constraints = {
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 12 } }, audio: false
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });

  poolState()
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {

  let startTimeMs = performance.now();

  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
  }

  drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function drawBlendShapes(el, blendShapes) {
  if (!blendShapes.length) {
    return;
  }

  const jawOpen = blendShapes[0].categories.filter((shape) => {
    return shape.categoryName == 'jawOpen'
  })[0]

  if (jawOpen.score > .5) {
    console.log('jump')
    return playerJump()
  }

  const kissy = blendShapes[0].categories.filter((shape) => {
    return shape.categoryName == 'mouthPucker'
  })[0]

  if (kissy.score > .5) {
    console.log('kiss')
    return playerJump()
  }

  const browInnerUp = blendShapes[0].categories.filter((shape) => {
    return shape.categoryName == 'browInnerUp'
  })[0]

  if (browInnerUp.score > .5) {
    console.log('brow')
    return playerJump()
  }
}
