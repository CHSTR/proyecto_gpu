const faceapi = require('@vladmandic/face-api');

const modelsPath = './model';

async function loadModels() {
  try {
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  loadModels,
};
