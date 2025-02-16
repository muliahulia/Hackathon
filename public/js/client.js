import * as THREE from 'three';
import { PointerLockControls } from '../jsm/controls/PointerLockControls.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';
import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';
import Stats from '../jsm/libs/stats.module.js';
import { GUI } from '../jsm/libs/lil-gui.module.min.js';
import { HomeScreen } from './homeScreen.js';



// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.8, 5);
const listener = new THREE.AudioListener();
camera.add(listener);

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    logarithmicDepthBuffer: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// FPS Controls
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => controls.lock());

// Lighting Setup
const ambientLight = new THREE.AmbientLight(0xefc576, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Texture Loader
const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

// Museum Model Setup
const museumMaterial = new THREE.MeshStandardMaterial({
    map: loadTexture('/textures/Art room01_Art_Room1_BaseColor.png'),
    roughnessMap: loadTexture('/textures/Art room01_Art_Room1_Roughness.png'),
    metalnessMap: loadTexture('/textures/Art room01_Art_Room1_Metallic.png'),
    normalMap: loadTexture('/textures/Art room01_Art_Room1_Normal.png'),
    displacementMap: loadTexture('/textures/Art room01_Art_Room1_Height.png'),
    displacementScale: 0.05,
    emissiveMap: loadTexture('/textures/Art room01_Art_Room1_Emissive.png'),
    emissiveIntensity: 0.5,
    emissive: new THREE.Color(0xffffff),
});

const gltfLoader = new GLTFLoader();
gltfLoader.load('./models/final.glb', (gltf) => {
    const museum = gltf.scene;
    museum.traverse((child) => {
        if (child.isMesh) {
            child.material = museumMaterial;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(museum);
}, undefined, (error) => console.error('Error loading GLTF model:', error));

// Player Movement
const playerSpeed = 4;
const move = { forward: 0, right: 0 };
let prevTime = performance.now();

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyW') move.forward = 1;
    if (event.code === 'KeyS') move.forward = -1;
    if (event.code === 'KeyA') move.right = 1;
    if (event.code === 'KeyD') move.right = -1;
});

document.addEventListener('keyup', (event) => {
    if (['KeyW', 'KeyS'].includes(event.code)) move.forward = 0;
    if (['KeyA', 'KeyD'].includes(event.code)) move.right = 0;
});

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Stats Monitor
const stats = Stats();
document.body.appendChild(stats.dom);

// GUI
const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 10);
cameraFolder.open();

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const deltaTime = (time - prevTime) / 1000;
    prevTime = time;

    if (controls.isLocked) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();

        camera.position.addScaledVector(direction, move.forward * playerSpeed * deltaTime);
        camera.position.addScaledVector(right, move.right * playerSpeed * deltaTime);
    }

    renderer.render(scene, camera);
    stats.update();
}
animate();
