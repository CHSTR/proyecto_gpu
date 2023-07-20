// Funciones auxiliares para el proyecto
import * as THREE from 'https://unpkg.com/three@v0.154.0/build/three.module.js';

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
  cellularNoise: false,
  scale: 50,
};

const uniforms = {
  u_color: { value: new THREE.Color(config.color) },
  u_size: { value: config.size },
  u_delaunay: { value: false },
  u_points: { value: true },
  u_grid: { value: false },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_scale: { value: config.scale },
  u_cellularNoise: { value: false },
};

const updateSize = () => {
  uniforms.u_size.value = config.size;
};

const updateScale = () => {
  uniforms.u_scale.value = config.scale;
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
// gui.add(config, 'delaunay').name('Delaunay').onChange(Boolean);
gui.add(config, 'points').name('Puntos').onChange(Boolean);
gui.add(config, 'scale', 1, 100).step(1).name('Escala').onChange(updateScale);

// Control para activar/desactivar el efecto delaunay
const delaunayControl = gui.add(config, 'delaunay').name('Delaunay');
delaunayControl.onChange((value) => {
  uniforms.u_delaunay.value = value;
  // Habilitar/deshabilitar el control de cellular noise según el valor de u_delaunay
  cellularNoiseControl.__li.style.pointerEvents = value ? 'auto' : 'none';
});

// Control para activar/desactivar el efecto de cellular noise
const cellularNoiseControl = gui.add(config, 'cellularNoise').name('Cellular Noise');
cellularNoiseControl.onChange((value) => {
  uniforms.u_cellularNoise.value = value;
});
cellularNoiseControl.__li.style.pointerEvents = 'none'; // Inicialmente deshabilitado

// Establecer la opción "Cellular Noise" como dependiente de "Delaunay"
delaunayControl.listen().onChange((value) => {
  cellularNoiseControl.__li.style.pointerEvents = value ? 'auto' : 'none';
});

// Se declaran las variables que se utilizarán para dibujar los landmarks
var points;
var material;

function renderFaceLandmarks(landmarks) {
  // Transformar las coordenadas
  const scaledLandmarks = landmarks.map((point) => {
    const { height } = renderer.domElement;
    return {
      x: point.x,
      y: height - point.y,
    };
  });

  const positions = [];
  scaledLandmarks.forEach((position) => {
    const x = position.x;
    const y = position.y;
    const z = position.z || 0;
    positions.push(x, y, z);
  });

  const geometry = new THREE.BufferGeometry();

  if (config.delaunay) {
    // Convertir los puntos al formato requerido por d3-delaunay
    const puntosDelaunay = scaledLandmarks.map((punto) => [punto.x, punto.y]);

    // Crear la triangulación de Delaunay
    const delaunay = d3.Delaunay.from(puntosDelaunay);
    const triangulation = delaunay.triangles;

    // Crear un arreglo de índices de triángulos
    const indices = [];
    for (let i = 0; i < triangulation.length; i += 3) {
      // indices.push(triangulation[i], triangulation[i + 1], triangulation[i + 2]);
      indices.push(triangulation[i + 2], triangulation[i + 1], triangulation[i]);
    }

    // Crea una geometría para los triángulos utilizando los índices
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    if (config.cellularNoise) {
      material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: `
          uniform vec2 u_resolution;
          uniform float u_scale;
          uniform vec3 u_color;
          uniform bool u_grid;
    
      
          vec2 random2(vec2 p) {
            return fract(sin(vec2(dot(p, vec2(86, 311.7)), dot(p, vec2(269.5, 283.3)))) * 3.1488831);
          }
      
          void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;
            vec3 color = u_color;
      
            // Escala
            st *= u_scale;
      
            // Espacio de celdas
            vec2 i_st = floor(st);
            vec2 f_st = fract(st);
      
            float m_dist = 2.0;  // Distancia mínima
      
            // Se recorre la vecindad de la celda
            for (int i = -1; i <= 1; i++) {
              for (int j = -1; j <= 1; j++) {
                // Se define la posición del vecino
                vec2 neighbor = vec2(float(j), float(i));
      
                // Se define la posición del punto aleatorio a partir del vecino
                vec2 point = random2(i_st + neighbor);
      
                // Se calcula la distancia entre el punto y el vecino
                // Se guarda la distancia mínima 
                vec2 diff = neighbor + point - f_st;
                float dist = length(diff);
                m_dist = min(m_dist, dist);
              }
            }
            // Se aplica el color en función de la distancia mínima
            color += m_dist - 0.1;
      
            // Se agrega un color difuso en función a la distancia mínima
            color += 1. - step(.001, m_dist);
      
            // Dibujar grilla
            if (u_grid) {
              color.r += step(.98, f_st.x) + step(.98, f_st.y);
            }
            
            // Se aplica el color
            gl_FragColor = vec4(color, 0.1);
          }`,
      });
    } else {
      // Crea un material para los triángulos
      material = new THREE.MeshBasicMaterial({ color: config.color, wireframe: true });
    }

    // Crea una malla con la geometría y el material
    const mesh = new THREE.Mesh(geometry, material);

    // Agrega la malla a la escena
    scene.add(mesh);
  }

  if (config.points) {
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

    points = new THREE.Points(geometry, material);
    scene.add(points);
  }

  // Renderizar la escena utilizando el renderizador
  renderer.render(scene, camera);
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

  positions.length = 0;
  for (const person of data) {
    renderFaceLandmarks(person.landmarks.positions);
  }
  // Limpiar la escena
  scene.clear();
}

// Exportar funciones
export { str, log, drawFaces };