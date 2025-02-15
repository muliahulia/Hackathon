import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

// Renderer with **higher precision**
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

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting - More realistic & soft shadows
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Texture Loader with **anisotropy & filtering**
const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Sharpen textures
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

// Load **High-Quality PBR Textures**
const baseColorMap = loadTexture('/textures/Art room01_Art_Room1_BaseColor.png');
const roughnessMap = loadTexture('/textures/Art room01_Art_Room1_Roughness.png');
const emissiveMap = loadTexture('/textures/Art room01_Art_Room1_Emissive.png');
const metallicMap = loadTexture('/textures/Art room01_Art_Room1_Metallic.png');
const heightMap = loadTexture('/textures/Art room01_Art_Room1_Height.png');
const normalMap = loadTexture('/textures/Art room01_Art_Room1_Normal.png');

// Improved PBR Material
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

// Load Museum Model with **Smooth Rendering**
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

// Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
});

// Stats Monitor
const stats = Stats();
document.body.appendChild(stats.dom);

// GUI Controls for Camera
const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 10);
cameraFolder.open();

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

// Start Animation
animate();
