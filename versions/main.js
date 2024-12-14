import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import {Ghost} from "./Ghost.js";
import {Player} from "./Player.js";
import {Game} from "./Game.js";


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Create the floor
const floorGeometry = new THREE.BoxGeometry(19, 0.5, 17);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,          // Base color of the floor
    emissive: 0xffffff,       // Red glow color
    emissiveIntensity: 0.005,   // Initial emissive intensity
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -0.5; // Position below the game plane
floor.position.x = 19/2-1/2;
floor.position.z = 17/2-1/2;
scene.add(floor);

// Position the camera
camera.position.set(19/2-1/2, 25, 20);
camera.lookAt(19/2-1/2, 0, 0);

const game = new Game(scene);

/// Function to create walls with white borders
const createWall = (x, y, z) => {
    // Main wall body
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);

    // Thin white wireframe border for the wall
    const borderGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    const borderMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,   
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);

    // Group both the wall and border together
    const wallGroup = new THREE.Group();
    wallGroup.add(wall);
    wallGroup.add(border);

    // Set the position of the group
    wallGroup.position.set(x, y, z);

    return wallGroup;
};

// Generate walls and add to the scene
const maze = game.maze;
for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === 1) { // Walls
            const wall = createWall(c, 0, r);
            scene.add(wall);
        }
    }
}

// Create player and ghost placeholders
const createSphere = (color, x, y, z) => {
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(x, y, z);
    return sphere;
};

// Function to create pellets
const createPellet = (x, z, isPowerUp = false) => {
    const size = isPowerUp ? 0.2 : 0.1;
    const color = isPowerUp ? 0xffff00 : 0xffffff;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
    const pellet = new THREE.Mesh(geometry, material);
    pellet.quaternion.random();
    pellet.position.set(x, 0.2, z);
    return pellet;
};
  
// Arrays to store pellets and power-up pellets
const pellets = [];
const powerPellets = [];

// Generate pellets and add them to the scene
for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === 2) {
            const pellet = createPellet(c, r, false);
            pellets.push(pellet);
            scene.add(pellet);
        } else if (game.maze[r][c] === 3) {
            const powerPellet = createPellet(c, r, true);
            powerPellets.push(powerPellet);
            scene.add(powerPellet);
        }
    }
}

// This is a box for debugging visualisation
const pbg = new THREE.BoxGeometry(1,1,1);
const pbm = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 });
const pb = new THREE.Mesh(pbg, pbm);

scene.add(game.player.mesh);
scene.add(pb);

// Ghosts
game.ghosts.forEach(ghost => scene.add(ghost.mesh));
const clock = new THREE.Clock();

// Compose pipeline
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1,      // Strength of the glow
    0.01,   // Radius
    0.1     // Threshold
);
composer.addPass(bloomPass);


// Animate the scene
const animate = () => {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    // Update positions based on the game state
    game.player.mesh.position.set(game.player.c_, 0.5, game.player.r_);
    pb.position.set(game.player.c, 0.5, game.player.r);

    // Rotate pellets for a dynamic effect
    pellets.forEach(pellet => pellet.rotation.y += 0.03);
    powerPellets.forEach(powerPellet => powerPellet.rotation.y += 0.03);

    // Check for pellet consumption
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        if (Math.abs(game.player.mesh.position.x - pellet.position.x) < 0.5 &&
            Math.abs(game.player.mesh.position.z - pellet.position.z) < 0.5) {
            scene.remove(pellet);
            pellets.splice(i, 1);
        }
    }

    for (let i = powerPellets.length - 1; i >= 0; i--) {
        const powerPellet = powerPellets[i];
        if (Math.abs(game.player.mesh.position.x - powerPellet.position.x) < 0.5 &&
            Math.abs(game.player.mesh.position.z - powerPellet.position.z) < 0.5) {
            scene.remove(powerPellet);
            powerPellets.splice(i, 1);
        }
    }

    // Something is up with the ghost position code!!!!!!!
    //console.log("G", game.ghosts[0].dr, game.ghosts[0].dc);
    //game.ghosts[0].mesh.material.color = "0xff0000";
    
    game.ghosts.forEach((ghost, i) => {
        if (!ghost.walking){
            ghost.walking = true;
            const [position, direction] = ghost.frightenedChoice(); //ghost.nextPosition();
            ghost.setDirection(direction[0], direction[1]);
            ghost.walking = true;
        }
        ghost.walk(dt);
        ghost.mesh.position.set(ghost.c_, 0.5, ghost.r_);
    });

    // renderer.render(scene, camera);
    composer.render();
};


// Temporary controls for debugging
window.addEventListener('keydown', (event) => {
    const dt = 0.06;

    if (event.key === 'ArrowUp') game.player.moveForward(dt);
    if (event.key === 'ArrowDown') game.player.moveBackward(dt);
    if (event.key === 'ArrowLeft') game.player.rotateLeft(dt);
    if (event.key === 'ArrowRight') game.player.rotateRight(dt);
    
    if (event.key == "s"){
      console.log("Set to scattered mode")
      for (const ghost of game.ghosts){
        ghost.forcedReversal();
        ghost.state = 0;
      }
    }
    
    if (event.key == "c"){
      console.log("Set to chase mode")
      for (const ghost of game.ghosts){
        ghost.forcedReversal();
        ghost.state = 1;
      }
    }

    if (event.key == "f"){
      console.log("Set to frightened mode")
      for (const ghost of game.ghosts){
        ghost.forcedReversal();
        ghost.state = 2;
      }
    }

});


animate();

/*



















const G = new Game();









*/