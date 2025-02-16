import * as THREE from 'three';
import { PointerLockControls } from './jsm/controls/PointerLockControls.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';



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

async function queuePrompt(prompt) {
    const url = "http://192.30.89.51:55964/prompt";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const jsonResponse = await response.json();
        console.log("Response from ComfyUI:", jsonResponse);

        const historyUrl = `http://192.30.89.51:55964/history/${jsonResponse.prompt_id}`;

        try {
            const historyResponse = await fetch(historyUrl);
            if (!historyResponse.ok) {
                throw new Error(`HTTP error! Status: ${historyResponse.status}`);
            }

            const data = await historyResponse.json();
            console.log("Fetched Data:", data);
            const fileInfo = extractFileInfo(data);

            if (fileInfo) {
                getImage(fileInfo.filename, fileInfo.subfolder, fileInfo.filetype).then(imageUrl => {
                    if (imageUrl) {
                        console.log("Applying Image to Frame:", imageUrl);
                        applyTextureToFrame(imageUrl);
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching history data:", error);
        }

    } catch (error) {
        console.error("Error calling ComfyUI API:", error);
    }
}




const prompt = {
    "3": {
        "class_type": "KSampler",
        "inputs": {
            "cfg": 8,
            "denoise": 1,
            "latent_image": ["5", 0],
            "model": ["4", 0],
            "negative": ["7", 0],
            "positive": ["6", 0],
            "sampler_name": "euler",
            "scheduler": "normal",
            "seed": 8566257,  // Default seed
            "steps": 20
        }
    },
    "4": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": {
            "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"
        }
    },
    "5": {
        "class_type": "EmptyLatentImage",
        "inputs": {
            "batch_size": 1,
            "height": 512,
            "width": 512
        }
    },
    "6": {
        "class_type": "CLIPTextEncode",
        "inputs": {
            "clip": ["4", 1],
            "text": "masterpiece best quality girl" // Default prompt
        }
    },
    "7": {
        "class_type": "CLIPTextEncode",
        "inputs": {
            "clip": ["4", 1],
            "text": "bad hands"
        }
    },
    "8": {
        "class_type": "VAEDecode",
        "inputs": {
            "samples": ["3", 0],
            "vae": ["4", 2]
        }
    },
    "9": {
        "class_type": "SaveImage",
        "inputs": {
            "filename_prefix": "ComfyUI",
            "images": ["8", 0]
        }
    }
};

function extractFileInfo(jsonData) {
    const promptId = Object.keys(jsonData)[0]; // Get the main key (UUID)
    if (!jsonData[promptId]?.outputs?.["9"]?.images?.length) {
        console.error("No image data found!");
        return null;
    }

    const outputData = jsonData[promptId].outputs["9"].images[0];

    return {
        filename: outputData.filename || "default.png",
        subfolder: outputData.subfolder || "",
        filetype: outputData.type || "output"
    };
}


// Modify the prompt text and seed dynamically
prompt["6"]["inputs"]["text"] = "masterpiece best quality man";
prompt["3"]["inputs"]["seed"] = Math.floor(Math.random(1,5) * 10);  // Random seed

// Call the function to send the request

async function getImage(filename, subfolder, folderType) {
    const serverAddress = "192.30.89.51:55964"; // Update if needed
    const params = new URLSearchParams({
        filename: filename,
        subfolder: subfolder,
        type: folderType
    }).toString();

    const url = `http://${serverAddress}/view?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        console.log("Image URL:", imageUrl);

        return imageUrl; // Can be used in an <img> tag
    } catch (error) {
        console.error("Error fetching image:", error);
        return null;
    }
}

// Example Usage



import { TextureLoader, MeshStandardMaterial, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping } from 'three';

// Loaders
const gltfLoader = new GLTFLoader();
const textureLoader = new TextureLoader();

// Load the museum model
gltfLoader.load(
    './models/final.glb',  // Update this path to your GLB file
    (gltf) => {
        const museum = gltf.scene;

        // Traverse and find 'Frame1'
        museum.traverse((child) => {
            if (child.isMesh && child.name.includes("Frame")) {
                console.log("Found Frame1:", child);

                // Load high-quality random image
                queuePrompt(prompt);


                const url = "/generated/ComfyUI_00025_.png";
                textureLoader.load(url, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;

                    // Apply high-quality texture filtering
                    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();  // Max sharpness
                    texture.magFilter = LinearFilter;  // Smooth scaling up
                    texture.minFilter = LinearMipmapLinearFilter;  // Smooth scaling down
                    // texture.generateMipmaps = true;  // Enable mipmaps for better scaling
                    texture.flipY = false;
                    // Prevent stretching (optional)
                    // texture.wrapS = RepeatWrapping;
                    // texture.wrapT = RepeatWrapping;
                    // texture.repeat.set(1, .1); // Adjust if necessary

                    // Create a new material for Frame1 with improved texture quality
                    child.material = new MeshStandardMaterial({
                        map: texture,
                        roughness: 0.5,  // Adjust roughness for a more realistic look
                        metalness: 0.2   // Reduce metallic for a more natural feel
                    });

                    child.material.needsUpdate = true;
                    console.log("Updated high-quality texture for Frame1");
                });
            }
            child.castShadow = true;
            child.receiveShadow = true;
        });

        scene.add(museum);
        console.log('Museum model loaded with a high-quality random picture on Frame1!');
    },
    (xhr) => console.log(`GLTF Load Progress: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
    (error) => console.error('Error loading GLTF model:', error)
);

function applyTextureToFrame(imageUrl) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improves sharpness
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.flipY = false; // Needed if textures appear upside-down

        scene.traverse((child) => {
            if (child.isMesh && child.name.includes("Frame")) { 
                console.log("Applying texture to:", child.name);
                child.material = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: 0.5,
                    metalness: 0.2
                });
                child.material.needsUpdate = true;
            }
        });
    });
}





// Texture Loader

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
    // const objLoader = new OBJLoader();
    // objLoader.load(
    //     './models/untitled.obj',
    //     (museum) => {
    //         museum.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.material = museumMaterial; // Apply textures
    //                 child.castShadow = true;
    //                 child.receiveShadow = true;
    //             }
    //         });
    //         scene.add(museum);
    //     },
    //     (xhr) => console.log(`Museum Load Progress: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`),
    //     (error) => console.error('Error loading museum model:', error)
    // );

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
