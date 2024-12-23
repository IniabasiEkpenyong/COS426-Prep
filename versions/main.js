import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { Ghost } from './Ghost.js';
import { Player } from './Player.js';
import { Game } from './Game.js';

// Scene, camera, renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let firstPersonView = false; // Camera state toggle
document.getElementById("restart-button").addEventListener("click", () => {
    location.reload(); // Reload the page to reset the game
});


// Lighting
const light = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Floor
const floorGeometry = new THREE.BoxGeometry(19, 0.5, 17);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    emissive: 0xffffff,
    emissiveIntensity: 0.005,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -0.5;
floor.position.x = 19 / 2 - 0.5;
floor.position.z = 17 / 2 - 0.5;
scene.add(floor);

// Camera positioning
camera.position.set(19 / 2 - 0.5, 25, 20);
camera.lookAt(19 / 2 - 0.5, 0, 0);

const game = new Game(scene);

// Create walls for the maze
const createWall = (x, y, z) => {
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);

    const borderGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);

    const wallGroup = new THREE.Group();
    wallGroup.add(wall);
    wallGroup.add(border);
    wallGroup.position.set(x, y, z);
    return wallGroup;
};

// Add maze walls to the scene
const maze = game.maze;
for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === 1) {
            const wall = createWall(c, 0, r);
            scene.add(wall);
        }
    }
}

// Create pellets and power pellets
const createPellet = (x, z, isPowerUp = false) => {
    const size = isPowerUp ? 0.2 : 0.1;
    const color = isPowerUp ? 0xffff00 : 0xffffff;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
    const pellet = new THREE.Mesh(geometry, material);
    pellet.position.set(x, 0.2, z);
    return pellet;
};

const pellets = [];
const powerPellets = [];

for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
        if (maze[r][c] === 2) {
            const pellet = createPellet(c, r, false);
            pellets.push(pellet);
            scene.add(pellet);
        } else if (maze[r][c] === 3) {
            const powerPellet = createPellet(c, r, true);
            powerPellets.push(powerPellet);
            scene.add(powerPellet);
        }
    }
}

// Add player and ghosts to the scene
scene.add(game.player.mesh);
game.ghosts.forEach((ghost) => scene.add(ghost.mesh));

const clock = new THREE.Clock();

// Postprocessing pipeline
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.01, 0.1);
composer.addPass(bloomPass);

// Animate the scene
const animate = () => {
    if (game.isGameOver) {
        console.log("Animation stopped: Game Over.");
        return;
    }

    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    game.checkCollision();

    // Update player position
    game.player.updatePosition(dt);
    game.player.mesh.position.set(game.player.c_, 0.5, game.player.r_);

    // Update ghost positions and behaviors
    game.updateGhostModes(dt);
    game.ghosts.forEach((ghost) => {
        if (!ghost.walking) {
            if (ghost.state === 0) ghost.scatter(); // Scatter mode
            if (ghost.state === 1) ghost.chase();   // Chase mode
            if (ghost.state === 2) ghost.frightened(); // Frightened mode

            const [position, direction] = ghost.nextPosition();
            ghost.setDirection(direction[0], direction[1]);
            ghost.walking = true;
        }
        ghost.walk(dt);
        ghost.mesh.position.set(ghost.c_, 0.5, ghost.r_);
    });

    // Camera positioning
    if (firstPersonView) {
        camera.position.set(
            game.player.mesh.position.x - Math.cos(game.player.dir) * 0.5,
            1, // Slightly above Pac-Man
            game.player.mesh.position.z - Math.sin(game.player.dir) * 0.5
        );
        camera.lookAt(game.player.mesh.position);
    } else {
        // Default top-down view
        camera.position.set(19 / 2 - 0.5, 25, 20);
        camera.lookAt(19 / 2 - 0.5, 0, 0);
    }

    // Rotate pellets
    pellets.forEach((pellet) => (pellet.rotation.y += 0.03));
    powerPellets.forEach((powerPellet) => (powerPellet.rotation.y += 0.03));

    // Check for pellet collection
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

    composer.render();
};

// Key controls for debug and mode switching
window.addEventListener('keydown', (event) => {
    const dt = 0.06;

    if (event.key === 'ArrowUp') game.player.moveForward(dt);
    if (event.key === 'ArrowDown') game.player.moveBackward(dt);
    if (event.key === 'ArrowLeft') game.player.rotateLeft(dt);
    if (event.key === 'ArrowRight') game.player.rotateRight(dt);

    if (event.key === 's') {
        console.log("Scatter mode activated");
        game.ghosts.forEach((ghost) => {
            ghost.state = 0; // Scatter state
            ghost.scatter(); // Assign random scatter target
        });
    }
    if (game.isGameOver) {
        console.log("Animation stopped: Game Over.");
        return; // Stop animation if the game is over
    }
    if (event.key === 'c') {
        console.log("Chase mode activated");
        game.ghosts.forEach((ghost) => {
            ghost.state = 1; // Chase state
        });
    }

    if (event.key === 'f') {
        console.log("Frightened mode activated");
        game.ghosts.forEach((ghost) => {
            ghost.state = 2; // Frightened state
        });
    }

    if (event.key === 'v') {
        firstPersonView = !firstPersonView;
        console.log(`Camera mode: ${firstPersonView ? "First-Person" : "Default"}`);
    }
});

// Start animation
animate();


/*



















const G = new Game();









*/