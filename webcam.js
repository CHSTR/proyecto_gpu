// import * as faceapi from '../dist/face-api.esm.js'; // use when in dev mode
// import * as faceapi from '@vladmandic/face-api'; // use when downloading face-api as npm
//const faceapi = require('@vladmandic/face-api'); // use when downloading face-api as npm
import * as THREE from 'three';

// configuration options
//const modelPath = './model/'; // path to model folder that will be loaded using http
const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'; // path to model folder that will be loaded using http
const minScore = 0.3; // minimum score
const maxResults = 5; // maximum number of results to return
let optionsSSDMobileNet;

// helper function to pretty-print json object to string
function str(json) {
  let text = '<font color="lightblue">';
  text += json ? JSON.stringify(json).replace(/{|}|"|\[|\]/g, '').replace(/,/g, ', ') : '';
  text += '</font>';
  return text;
}

// helper function to print strings to html document as a log
function log(...txt) {
  console.log(...txt); // eslint-disable-line no-console
  const div = document.getElementById('log');
  if (div) div.innerHTML += `<br>${txt}`;
}

// // Crear una escena en Three.js
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);

// function renderFaceLandmarks(landmarks) {
//   const pointsContainer = document.getElementById('points-container');

//   landmarks.forEach((position) => {
//     const pointElement = document.createElement('div');
//     pointElement.classList.add('point');
//     pointElement.style.left = position.x + 'px';
//     pointElement.style.top = position.y + 'px';
//     pointsContainer.appendChild(pointElement);
//   });
// }


const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pointSize = 5;
const material = new THREE.PointsMaterial({ color: 0xffffff, size: pointSize });
const geometry = new THREE.BufferGeometry();
const positions = [];

// positions.push(0, 0, 0); // Coordenadas del punto (0, 0, 0) en el costado superior izquierdo
// geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
// let points = new THREE.Points(geometry, material);
// scene.add(points);

var points = null;
camera.position.z = 1000;

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();

function renderFaceLandmarks(landmarks) {
  positions.length = 0;

  // Transformar las coordenadas
  const scaledLandmarks = landmarks.map((point) => {
    const { height } = renderer.domElement;
    return {
      x: point.x,
      y: height - point.y,
    };
  });

  scaledLandmarks.forEach((position) => {
    const x = position.x;
    const y = position.y;
    const z = position.z || 0;
    positions.push(x, y, z);
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (points != null) scene.remove(points);

  points = new THREE.Points(geometry, material);
  scene.add(points);
}

// helper function to draw detected faces
function drawFaces(canvas, data, fps) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // draw title
  ctx.font = 'small-caps 20px "Segoe UI"';
  ctx.fillStyle = 'white';
  ctx.fillText(`FPS: ${fps}`, 10, 25);

  // const pointsContainer = document.getElementById('points-container');
  // pointsContainer.innerHTML = '';

  for (const person of data) {
    console.log(data.length)
    renderFaceLandmarks(person.landmarks.positions);
  }
}

async function detectVideo(video, canvas) {
  if (!video || video.paused) return false;
  const t0 = performance.now();
  faceapi
    .detectAllFaces(video, optionsSSDMobileNet)
    .withFaceLandmarks()
    //.withFaceExpressions()
    // .withFaceDescriptors()
    //.withAgeAndGender()
    .then((result) => {
      const fps = 1000 / (performance.now() - t0);
      drawFaces(canvas, result, fps.toLocaleString());
      requestAnimationFrame(() => detectVideo(video, canvas));
      return true;
    })
    .catch((err) => {
      log(`Detect Error: ${str(err)}`);
      return err;
    });
  return false;
}

// just initialize everything and call main function
async function setupCamera() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return null;

  // log('Setting up camera');
  // setup webcam. note that navigator.mediaDevices requires that page is accessed via https
  if (!navigator.mediaDevices) {
    // log('Camera Error: access not supported');
    return null;
  }
  let stream;
  const constraints = { audio: false, video: { facingMode: 'user', resizeMode: 'crop-and-scale' } };
  if (window.innerWidth > window.innerHeight) constraints.video.width = { ideal: window.innerWidth };
  else constraints.video.height = { ideal: window.innerHeight };
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err.name === 'PermissionDeniedError' || err.name === 'NotAllowedError') log(`Camera Error: camera permission denied: ${err.message || err}`);
    // if (err.name === 'SourceUnavailableError') log(`Camera Error: camera not available: ${err.message || err}`);
    return null;
  }
  if (stream) {
    video.srcObject = stream;
  } else {
    // log('Camera Error: stream empty');
    return null;
  }
  const track = stream.getVideoTracks()[0];
  const settings = track.getSettings();
  if (settings.deviceId) delete settings.deviceId;
  if (settings.groupId) delete settings.groupId;
  if (settings.aspectRatio) settings.aspectRatio = Math.trunc(100 * settings.aspectRatio) / 100;
  // log(`Camera active: ${track.label}`);
  // log(`Camera settings: ${str(settings)}`);
  canvas.addEventListener('click', () => {
    if (video && video.readyState >= 2) {
      if (video.paused) {
        video.play();
        detectVideo(video, canvas);
      } else {
        video.pause();
      }
    }
    // log(`Camera state: ${video.paused ? 'paused' : 'playing'}`);
  });
  return new Promise((resolve) => {
    video.onloadeddata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.play();
      detectVideo(video, canvas);
      resolve(true);
    };
  });
}

async function setupFaceAPI() {
  // load face-api models
  // log('Models loading');
  // await faceapi.nets.tinyFaceDetector.load(modelPath); // using ssdMobilenetv1
  await faceapi.nets.ssdMobilenetv1.load(modelPath);
  await faceapi.nets.ageGenderNet.load(modelPath);
  await faceapi.nets.faceLandmark68Net.load(modelPath);
  await faceapi.nets.faceRecognitionNet.load(modelPath);
  await faceapi.nets.faceExpressionNet.load(modelPath);
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });
  // check tf engine state
  // log(`Models loaded: ${str(faceapi.tf.engine().state.numTensors)} tensors`);
}

async function main() {
  // initialize tfjs
  // log('FaceAPI WebCam Test');

  // if you want to use wasm backend location for wasm binaries must be specified
  // await faceapi.tf?.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${faceapi.tf.version_core}/dist/`);
  // await faceapi.tf?.setBackend('wasm');
  // log(`WASM SIMD: ${await faceapi.tf?.env().getAsync('WASM_HAS_SIMD_SUPPORT')} Threads: ${await faceapi.tf?.env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT') ? 'Multi' : 'Single'}`);

  // default is webgl backend
  await faceapi.tf.setBackend('webgl');
  await faceapi.tf.ready();

  // tfjs optimizations
  // if (faceapi.tf?.env().flagRegistry.CANVAS2D_WILL_READ_FREQUENTLY) faceapi.tf.env().set('CANVAS2D_WILL_READ_FREQUENTLY', true);
  // if (faceapi.tf?.env().flagRegistry.WEBGL_EXP_CONV) faceapi.tf.env().set('WEBGL_EXP_CONV', true);
  // if (faceapi.tf?.env().flagRegistry.WEBGL_EXP_CONV) faceapi.tf.env().set('WEBGL_EXP_CONV', true);

  // check version
  // log(`Version: FaceAPI ${str(faceapi?.version || '(not loaded)')} TensorFlow/JS ${str(faceapi.tf?.version_core || '(not loaded)')} Backend: ${str(faceapi.tf?.getBackend() || '(not loaded)')}`);

  await setupFaceAPI();
  await setupCamera();
}

// start processing as soon as page is loaded
window.onload = main;
