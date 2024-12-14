import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background

// Set up the camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(3, 3, 5);

// Set up the WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls for interactivity
const controls = new OrbitControls(camera, renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Load the OBJ file
const loader = new OBJLoader();
loader.load(
    './models/custom_mesh.obj', // Path to your OBJ file
    (obj) => {
        // Adjust the loaded object if needed
        const meshScaling = 0.1;
        obj.scale.set(meshScaling, meshScaling, meshScaling); // Scale the object
        obj.position.set(0, 0, 0); // Position it in the center
        obj.traverse((child) => {
            if (child.isMesh) {
                // Apply a standard material to all meshes in the OBJ
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x00ff00, // Green color
                    emissive: 0x220000, // Subtle glow
                    roughness: 0.5,
                    metalness: 0.3
                });
            }
        });
        scene.add(obj); // Add the object to the scene
    },
    (xhr) => {
        // Progress callback
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        // Error callback
        console.error('An error occurred while loading the OBJ file', error);
    }
);

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    // Render the scene
    renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
