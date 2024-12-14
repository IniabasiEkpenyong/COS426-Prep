// Import necessary components from THREE.js and its addons
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Walker{
    constructor(r, c, dr, dc){
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        this.material = new THREE.MeshStandardMaterial({color: 0x00ff00});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.r = r;
        this.c = c;
        this.dr = dr;
        this.dc = dc;
        this.nr = null;
        this.nc = null;
        
        this.walking = false;
        this.walkingSpeed = 1;
        this.walkingProgress = 0;
    }

    setWalk(dr, dc){
        this.dr = dr;
        this.dc = dc;

        this.nr = this.r + this.dr;
        this.nc = this.c + this.dc;
    }

    walk(dt){
        this.walkingProgress += dt * this.walkingSpeed;
        if (this.walkingProgress >= 1){
            this.r = this.nr;
            this.c = this.nc;

            this.dr = null;
            this.dc = null;
            this.nr = null;
            this.nc = null;
            
            this.walkingProgress = 0;
            this.walking = false;
        } 
        else {
            this.r += dt * this.dr * this.walkingSpeed;
            this.c += dt * this.dc * this.walkingSpeed;
        }
    }

    chooseDirection(){
        const randomIndex = Math.floor(Math.random() * 4);
        const directions = [[0,1],[1,0],[-1,0],[0,-1]];
        return directions[randomIndex];
    }
}

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Black background

// Set up the camera
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.set(2, 2, 5);

// Set up the WebGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls for interactivity
const controls = new OrbitControls(camera, renderer.domElement);

const walker = new Walker(0, 0);
walker.walkingSpeed = 10;

scene.add(walker.mesh);

const light = new THREE.PointLight(0xffffff, 20, 100);
light.position.set(5, 5, 5);
scene.add(light);

const clock = new THREE.Clock();

// Animation loop
const animate = () => {
    const dt = clock.getDelta();
    requestAnimationFrame(animate);
    if (!walker.walking){
        walker.walking = true;
        const direction = walker.chooseDirection();
        //console.log("Chose direction ", direction);
        walker.setWalk(direction[0], direction[1]);
        walker.walking = true;
    }
    walker.walk(dt)
    walker.mesh.position.x = walker.r;
    walker.mesh.position.z = walker.c;
    renderer.render(scene, camera);
};

animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
});
