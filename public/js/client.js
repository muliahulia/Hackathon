import * as THREE from 'three';
import { PointerLockControls } from '../jsm/controls/PointerLockControls.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';
import Stats from '../jsm/libs/stats.module.js';
import { GUI } from '../jsm/libs/lil-gui.module.min.js';
import { HomeScreen } from './homeScreen.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.8, 5);

const listener = new THREE.AudioListener();
camera.add(listener);

const backaudio = new THREE.AudioLoader();
const backgroundSound = new THREE.Audio(listener);
backaudio.load('Music/background.mp3', (buffer) => {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.1);
    backgroundSound.play();
});

const audioLoader = new THREE.AudioLoader();
const footstepSound = new THREE.Audio(listener);
audioLoader.load('Music/foot.mp3', (buffer) => {
    footstepSound.setBuffer(buffer);
    footstepSound.setVolume(0.5);
});

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    logarithmicDepthBuffer: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const homeScreen = new HomeScreen(scene, camera, renderer);

const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => {
    if (!homeScreen.isActive) {
        controls.lock();
    }
});

controls.addEventListener('lock', () => {
    console.log("Controls locked! Movement enabled.");
    controls.enabled = true;
});

controls.addEventListener('unlock', () => {
    console.log("Controls unlocked! Movement disabled.");
    controls.enabled = false;
    homeScreen.show();
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
}

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
        animate();
    }
);

const playerSpeed = 4;
const move = { forward: 0, right: 0 };
let prevTime = performance.now();
let isMoving = false;

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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const stats = Stats();
document.body.appendChild(stats.dom);

const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'z', 0, 10);
cameraFolder.open();

function animate() {
    requestAnimationFrame(animate);

    if (!homeScreen.isActive && controls.isLocked) {
        const time = performance.now();
        const deltaTime = (time - prevTime) / 1000;
        prevTime = time;

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




// document.getElementById("close-chat").addEventListener("click", () => {
    //     document.getElementById("chatbot-container").style.display = "none";
    // });
    
    // document.getElementById("chatbot-send").addEventListener("click", async () => {
    //     const inputField = document.getElementById("chatbot-input");
    //     const userPrompt = inputField.value.trim();
        
    //     if (userPrompt) {
    //         appendMessage("user", userPrompt);
    //         inputField.value = ""; 
    
    //         // Get AI-generated image
    //         const imageUrl = await generateAIImage(userPrompt);
            
    //         if (imageUrl) {
    //             const imgElement = document.getElementById("generated-image");
    //             imgElement.src = imageUrl;
    //             imgElement.style.display = "block";
    //             appendMessage("ai", "Here is your generated image:");
    //         } else {
    //             appendMessage("ai", "Failed to generate image.");
    //         }
    //     }
    // });
    
    // async function generateAIImage(prompt) {
    //     try {
    //         const response = await fetch("/generate-image", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ prompt }),
    //         });
    //         const data = await response.json();
    //         return data.imageUrl;
    //     } catch (error) {
    //         console.error("Error generating image:", error);
    //         return null;
    //     }
    // }
    