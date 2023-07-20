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

const positions = [];
camera.position.z = 1000;

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

render();

// GUI
const gui = new dat.GUI();

const config = {
    size: 3.0,
    color: '#000000',
    delaunay: false,
    points: true,
};

const uniforms = {
    u_color: { value: new THREE.Color(config.color) },
    u_size: { value: config.size },
    u_delaunay: { value: false },
    u_points: { value: true },
};

const updateSize = () => {
    uniforms.u_size.value = config.size;
};

const updateColor = () => {
    uniforms.u_color.value = new THREE.Color(config.color);
};

Boolean = () => {
  uniforms.u_delaunay.value = config.delaunay;
  uniforms.u_points.value = config.delaunay;
};

gui.add(config, 'size', 1, 10).step(1).name('Tamaño de puntos').onChange(updateSize);
gui.addColor(config, 'color').name('Color').onChange(updateColor);
gui.add(config, 'delaunay').name('Delaunay').onChange(Boolean);
gui.add(config, 'points').name('Puntos').onChange(Boolean);

// Se declaran las variables que se utilizarán para dibujar los landmarks
var points;
var mesh; 
var material;

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

  const geometry = new THREE.BufferGeometry();

  if(config.delaunay) {
    // Convertir los puntos al formato requerido por d3-delaunay
    const puntosDelaunay = scaledLandmarks.map((punto) => [punto.x, punto.y]);

    // Crear la triangulación de Delaunay
    const delaunay = d3.Delaunay.from(puntosDelaunay);
    const triangulation = delaunay.triangles;

    // Crear un arreglo de índices de triángulos
    const indices = [];
    for (let i = 0; i < triangulation.length; i += 3) {
      // indices.push(triangulation[i], triangulation[i + 1], triangulation[i + 2]);
      indices.push(triangulation[i+2], triangulation[i + 1], triangulation[i]);
    }

    // Crear un arreglo de coordenadas UV
    const uvs = [];
    for (let i = 0; i < scaledLandmarks.length; i++) {
      const { x, y } = scaledLandmarks[i];
      const u = x / renderer.domElement.width;
      const v = y / renderer.domElement.height;
      uvs.push(u, v);
    }

    // Crea una geometría para los triángulos utilizando los índices
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    // Crea un material para los triángulos
    material = new THREE.MeshBasicMaterial({ color: config.color, wireframe: true });
    // const textureLoader = new THREE.TextureLoader();
    // const texture = textureLoader.load('./textura.jpg', (texture) => {
    //   // Se ejecuta cuando la textura se ha cargado completamente

    //   // Convertir las coordenadas UV del d3-delaunay a formato Three.js
    //   // const uvs = scaledLandmarks.map((punto) => [punto.x / (renderer.domElement.width), punto.y / (renderer.domElement.height)]);

    //   // Crear la geometría con las coordenadas UV
    //   const geometry = new THREE.BufferGeometry();
    //   geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    //   geometry.setAttribute('uv', new THREE.Float32BufferAttribute(puntosDelaunay, 2));
    //   geometry.setIndex(indices);

    //   // Crear el material con la textura
    //   const material = new THREE.MeshBasicMaterial({ map: texture });

    //   // Crear la malla con la geometría y el material
    //   const mesh = new THREE.Mesh(geometry, material);

    //   // Agregar la malla a la escena
    //   scene.add(mesh);
    // });

    // material = new THREE.MeshBasicMaterial({ map: texture });
    // console.log(material)

    if (mesh != null) {
      scene.remove(mesh);
    }

    // Crea una malla con la geometría y el material
    mesh = new THREE.Mesh(geometry, material);

    // Agrega la malla a la escena
    scene.add(mesh);
  }

  if(config.points) {
    // Crear material con shaders personalizados
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: `
        uniform vec3 u_color;
        uniform float u_size;

        void main() {
          vec3 color = u_color;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = u_size;
        }
      `,
      fragmentShader: `
        uniform vec3 u_color;

        void main() {
          vec3 color = u_color;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    if (points != null){ 
      scene.remove(points);
    }

    points = new THREE.Points(geometry, material);
    scene.add(points);
  }

  // Renderizar la escena utilizando el renderizador
  renderer.render(scene, camera);
  
  // // Crear material con shaders personalizados
  // const material = new THREE.ShaderMaterial({
  //   uniforms: uniforms,
  //   vertexShader: `
  //     uniform vec3 u_color;

  //     void main() {
  //       vec3 color = u_color;
  //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //     }
  //   `,
  //   fragmentShader: `
  //     uniform vec3 u_color;

  //     void main() {
  //       vec3 color = u_color;
  //       gl_FragColor = vec4(color, 1.0);
  //     }
  //   `,
  // });

  // // Eliminar el mesh existente si lo hay
  // if (mesh != null) {
  //   scene.remove(mesh);
  // }

  // // Crear un objeto THREE.Mesh con la geometría y el material
  // mesh = new THREE.Mesh(geometry, material);
  // scene.add(mesh);
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
    // Limpiar la escena
    scene.clear();
}

// Exportar funciones
export { str, log, drawFaces };