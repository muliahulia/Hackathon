import * as THREE from 'three';
import { PointerLockControls } from '../jsm/controls/PointerLockControls.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';
import Stats from '../jsm/libs/stats.module.js';
import { GUI } from '../jsm/libs/lil-gui.module.min.js';
import { HomeScreen } from './homeScreen.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa); // light gray background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.8, 5); // Adjusted for first-person height

// Add an audio listener for the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// Background audio setup (plays continuously)
const backaudio = new THREE.AudioLoader();
const backgroundSound = new THREE.Audio(listener);
backaudio.load('Music/background.mp3', (buffer) => {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.1);
    backgroundSound.play();  // Starts playing immediately after loading
});

// Load the footstep sound
const audioLoader = new THREE.AudioLoader();
const footstepSound = new THREE.Audio(listener);
audioLoader.load('Music/foot.mp3', (buffer) => {
    footstepSound.setBuffer(buffer);
    footstepSound.setVolume(0.5); 
});

// Renderer setup
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance", // Use best available GPU settings
    logarithmicDepthBuffer: true // Helps with depth precision
});
renderer.setPixelRatio(window.devicePixelRatio); // Improve clarity
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable real-time shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Higher quality shadows
document.body.appendChild(renderer.domElement);

// PointerLockControls for first-person camera movement
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// Home Screen UI
const homeScreen = new HomeScreen(scene, camera, renderer);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Texture Loader and PBR materials
const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Sharpen textures
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

const baseColorMap = loadTexture('/textures/Art room01_Art_Room1_BaseColor.png');
const roughnessMap = loadTexture('/textures/Art room01_Art_Room1_Roughness.png');
const emissiveMap = loadTexture('/textures/Art room01_Art_Room1_Emissive.png');
const metallicMap = loadTexture('/textures/Art room01_Art_Room1_Metallic.png');
const heightMap = loadTexture('/textures/Art room01_Art_Room1_Height.png');
const normalMap = loadTexture('/textures/Art room01_Art_Room1_Normal.png');

const museumMaterial = new THREE.MeshStandardMaterial({
    map: baseColorMap,
    roughnessMap: roughnessMap,
    metalnessMap: metallicMap,
    normalMap: normalMap,
    displacementMap: heightMap,
    displacementScale: 0.05, // Adjust height effect
    emissiveMap: emissiveMap,
    emissiveIntensity: 0.5, // Adjust glow strength
    emissive: new THREE.Color(0xffffff),
});

// Load Museum Model
const objLoader = new OBJLoader();
objLoader.load(
    './models/museum.obj',
    (museum) => {
        museum.traverse((child) => {
            if (child.isMesh) {
                child.material = museumMaterial;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        museum.scale.set(1, 1, 1);
        museum.position.set(0, 0, 0);
        scene.add(museum);
    },
    (xhr) => console.log(`Museum OBJ: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`),
    (error) => console.error('Error loading museum model:', error)
);

// Player Movement Variables
const playerSpeed = 4;
const move = { forward: 0, right: 0 };
let prevTime = performance.now();
let isMoving = false; // Track movement status

// Movement Listeners
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

// GUI Controls for Camera
const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 10);
cameraFolder.open();

// Animation Loop (Updated for First-Person Movement)
function animate() {
    requestAnimationFrame(animate);

    // Only update controls if the home screen is not active
    if (!homeScreen.isActive) {
        controls.update();
    }

    const time = performance.now();
    const deltaTime = (time - prevTime) / 1000;
    prevTime = time;

    if (move.forward !== 0 || move.right !== 0) {
        if (!isMoving) {
            footstepSound.play(); // Play footstep sound when the player starts moving
            isMoving = true;
        }
    } else {
        if (isMoving) {
            footstepSound.stop(); // Stop footstep sound when the player stops
            isMoving = false;
        }
    }

    // Move player in the direction they're facing
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement along the horizontal plane

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();

    camera.position.addScaledVector(direction, move.forward * playerSpeed * deltaTime);
    camera.position.addScaledVector(right, move.right * playerSpeed * deltaTime);

    renderer.render(scene, camera);
    stats.update();
}

// HomeScreen Event Handling
window.addEventListener('joinMuseum', () => {
    controls.lock();
    homeScreen.hide();
});

// Start the animation loop
animate();
