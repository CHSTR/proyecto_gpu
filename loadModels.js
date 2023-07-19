// Archivo para cargar los modelos de face-api.js

// Variables para definir el nivel de confianza para detectar caras
const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'; // path to model folder that will be loaded using http
const minScore = 0.3; // minimum score
const maxResults = 5; // maximum number of results to return
let optionsSSDMobileNet;

async function setupFaceAPI() {
    console.log('Models loading');
    await faceapi.nets.ssdMobilenetv1.load(modelPath);
    await faceapi.nets.ageGenderNet.load(modelPath);
    await faceapi.nets.faceLandmark68Net.load(modelPath);
    await faceapi.nets.faceRecognitionNet.load(modelPath);
    await faceapi.nets.faceExpressionNet.load(modelPath);
    optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: minScore, maxResults });
}

export { setupFaceAPI, optionsSSDMobileNet };