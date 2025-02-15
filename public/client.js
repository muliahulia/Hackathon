import * as THREE from 'three';
import { PointerLockControls } from './jsm/controls/PointerLockControls.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';

// Scene
const scene = new THREE.Scene();

// fps camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.8, 5); 

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// FPS Controls (Pointer Lock)
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Player Movement Variables
const playerSpeed = 4;
const move = { forward: 0, right: 0 };
let prevTime = performance.now();

// Texture Loader
const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Sharpen textures
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

// Load Textures for Museum
const baseColorMap = loadTexture('/textures/Art room01_Art_Room1_BaseColor.png');
const roughnessMap = loadTexture('/textures/Art room01_Art_Room1_Roughness.png');
const emissiveMap = loadTexture('/textures/Art room01_Art_Room1_Emissive.png');
const metallicMap = loadTexture('/textures/Art room01_Art_Room1_Metallic.png');
const heightMap = loadTexture('/textures/Art room01_Art_Room1_Height.png');
const normalMap = loadTexture('/textures/Art room01_Art_Room1_Normal.png');

// Museum Material
const museumMaterial = new THREE.MeshStandardMaterial({
    map: baseColorMap,
    roughnessMap: roughnessMap,
    metalnessMap: metallicMap,
    normalMap: normalMap,
    displacementMap: heightMap,
    displacementScale: 0.05,
    emissiveMap: emissiveMap,
    emissiveIntensity: 0.5,
    emissive: new THREE.Color(0xffffff),
});

// Load Museum Model and Apply Textures
const objLoader = new OBJLoader();
objLoader.load(
    './models/museum.obj',
    (museum) => {
        museum.traverse((child) => {
            if (child.isMesh) {
                child.material = museumMaterial; // Apply textures
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(museum);
    },
    (xhr) => console.log(`Museum Load Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`),
    (error) => console.error('Error loading museum model:', error)
);

// Handle Movement Controls
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': move.forward = 1; break;
        case 'KeyS': move.forward = -1; break;
        case 'KeyA': move.right = 1; break;
        case 'KeyD': move.right = -1; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': 
        case 'KeyS': move.forward = 0; break;
        case 'KeyA': 
        case 'KeyD': move.right = 0; break;
    }
});

// Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Stats Monitor
const stats = Stats();
document.body.appendChild(stats.dom);

// Animation Loop for Movement
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const deltaTime = (time - prevTime) / 1000;
    prevTime = time;

    if (controls.isLocked) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        camera.position.addScaledVector(direction, move.forward * playerSpeed * deltaTime);
        camera.position.addScaledVector(right, move.right * playerSpeed * deltaTime);
    }

    renderer.render(scene, camera);
    stats.update();
}

animate();
