// Funciones auxiliares para el proyecto
import * as THREE from 'three';

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

// ---------------------------------------------------------------------------------------------
// Se crean las funciones que se utilizarán para dibujar los landmarks con three.js
// ---------------------------------------------------------------------------------------------

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pointSize = 5;
const material = new THREE.PointsMaterial({ color: 0xffffff, size: pointSize });
const geometry = new THREE.BufferGeometry();
const positions = [];

var points = null;
camera.position.z = 1000;

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();

// helper function to render face landmarks
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

// helper function to draw face landmarks
function drawFaces(canvas, data, fps) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw title
    ctx.font = 'small-caps 20px "Segoe UI"';
    ctx.fillStyle = 'white';
    ctx.fillText(`FPS: ${fps}`, 10, 25);

    for (const person of data) {
        console.log(data.length)
        renderFaceLandmarks(person.landmarks.positions);
    }
}

// Exportar funciones
export { str, log, drawFaces };