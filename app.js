const tf = require('@tensorflow/tfjs-node-gpu');
const faceapi = require('@vladmandic/face-api');

const express = require('express');
const multer = require('multer');

const canvas = require('canvas');
const { Image, createCanvas } = canvas
const { getFaceDetectorOptions } = require('./faceDetector');
const { loadModels } = require('./modelLoader');

const app = express();
const port = 3000;

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize face-api.js models
let modelsLoaded = loadModels();

// Define route for processing the uploaded image
app.post('/process-image', upload.single('image'), async (req, res) => {
  try {

    // Create a new canvas
    const canvas = createCanvas();
    const context = canvas.getContext('2d');

    // Load the image buffer into an HTMLImageElement
    const image = new Image();
    image.src = req.file.buffer;
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
    const tensor = tf.browser.fromPixels(canvas);

    // Detect faces and landmarks in the image
    const detections = await faceapi.detectAllFaces(tensor, getFaceDetectorOptions(faceapi.nets.ssdMobilenetv1)).withFaceLandmarks();
    const landmarks = detections.map((detection) => detection.landmarks.positions);

    res.json({ landmarks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing the image' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
