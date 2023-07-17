const faceapi = require('@vladmandic/face-api');

// SsdMobilenetv1Options
const minConfidence = 0.5;

// TinyFaceDetectorOptions
const inputSize = 408;
const scoreThreshold = 0.5;

function getFaceDetectorOptions(net) {
  return net === faceapi.nets.ssdMobilenetv1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence })
    : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

module.exports = {
  getFaceDetectorOptions,
};
