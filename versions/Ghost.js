import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// We will center the grid cubes at integers, to offset any 1/2 calculations
export class Ghost{
    constructor(game, r, c, str, stc){
        this.game = game;

        // current integer co-ordinates on the grid 
        this.r = r;
        this.c = c;

        // world coordinates 
        this.r_ = r;
        this.c_ = c;

        // the static square they want to move to
        this.str = str;
        this.stc = stc;

        // the direction ghost wants to move in
        this.dr = null;
        this.dc = null;

        // if walking, where will they finish?
        this.nr = null;
        this.nc = null;

        // the target square they are trying to get to
        this.tr = null;
        this.tc = null;

        // ghost scattered / chase / scared state
        this.state = 1; 

        // are they currently walking?
        this.walking = false;
        this.walkingProgress = 0;
        this.walkingSpeed = 1;

        // create mesh
        const tempGeometry = new THREE.BoxGeometry(1, 1, 1);
        const tempMaterial = new THREE.MeshStandardMaterial({color: 0xff0000});
        this.mesh = new THREE.Mesh(tempGeometry, tempMaterial);
        Ghost.loadMesh(this, game.scene);         
    }

    // ghost will now move in the direction of dr, dc <- IT IS RECOMMENDED TO DO THIS BEFORE CALCULATING NEXT POSITION
    setDirection(dr, dc){
        this.dr = dr;
        this.dc = dc;
        this.nr = this.r + dr;
        this.nc = this.c + dc;
    }
    
    // set target (doesn't recalculate the dr, dc)
    setTarget(tr, tc){
        this.tr = tr;
        this.tc = tc;
    }

    forcedReversal(){
        this.setDirection(this.dr * -1, this.dc * -1);
    }

    walk(dt){
        // attempted to walk without permission
        if (!this.walking) return;
        this.walkingProgress += dt * this.walkingSpeed;
 
        // if more than halfway we are efectively at the other cell?
        if (this.walkingProgress >= 0.5){
            this.r = this.nr;
            this.c = this.nc;
            this.game.ghostMoved(this);
        }

        // fix to end location if reached
        if (this.walkingProgress >= 1){
            this.r = this.nr;
            this.c = this.nc;
            this.r_ = this.nr;
            this.c_ = this.nc;

            // THIS MIGHT BE CAUSING ISSSSSSSSSSUUUUUUUUUUUUUUUEEEEEEEEEEEEEESSSSSSSSS LATER <- SO BE WARNED
            // WE SHOULD MAKE THE GHOSTS UPDAET THEIR DR WHEN THEY WANT AS THEY MIGHT BE IN THE MIDDLE OF WALKING! (TRY THIS REGARDLESS)
            // ELSE SCATTER MORE GHOSTS!!! (IN THE NEXT ITERATION I GUESS)

            //this.dr = null;
            //this.dc = null;
            
            //this.nr = null;
            //this.nc = null;
            
            this.walkingProgress = 0;
            this.walking = false;
        } 

        // add movements
        else {
            this.r_ += dt * this.dr * this.walkingSpeed;
            this.c_ += dt * this.dc * this.walkingSpeed;
        }
    }

    frightenedChoice(){

        const moves = new Map();
        moves.set([0,1].toString(), this.game.maze[this.r][this.c+1] != 1);
        moves.set([1,0].toString(), this.game.maze[this.r+1][this.c] != 1);
        moves.set([0,-1].toString(), this.game.maze[this.r][this.c-1] != 1);
        moves.set([-1,0].toString(), this.game.maze[this.r-1][this.c] != 1);

      const prefs = [[0,1],[1,0],[0,-1],[-1,0]];
      let index = Math.floor(Math.random() * 4 - 0.0001);
      for (let i=0; i<4; i++){
        let j = (index+i) % 4;
        // make sure its not opposite - this may cause a glitch if the reversal happens at the exact time before - pray this doesnt happen
        if (moves.get(prefs[j].toString()) && !(prefs[j][0] == -this.dr && prefs[j][1] == -this.dc)) return [[prefs[j][0]+this.r, prefs[j][1]+this.c], prefs[j]];
      }
      return [[this.r,this.c],[0,0]];
    }

    // return new position and direction of this movement
    nextPosition(){
      const moves = new Map();
      moves.set([0,1].toString(), this.game.maze[this.r][this.c+1] != 1);
      moves.set([1,0].toString(), this.game.maze[this.r+1][this.c] != 1);
      moves.set([0,-1].toString(), this.game.maze[this.r][this.c-1] != 1);
      moves.set([-1,0].toString(), this.game.maze[this.r-1][this.c] != 1);
  
      if (this.state == 2){
        return this.frightenedChoice();
      }
  
      if (
        !moves.get([this.dr, this.dc].toString()) || 
        (this.dr == 0 && (moves.get([1,0].toString()) || moves.get([-1,0].toString()))) || 
        (this.dc == 0 && (moves.get([0,1].toString()) || moves.get([0,-1].toString())))
      ){
        let bestDirection = [0,0];
        let bestDistance = 1e10;
        
        [[0,1],[1,0],[0,-1],[-1,0]].forEach((key) => {
          if (moves.get(key.toString()) && !(key[0] == -this.dr && key[1] == -this.dc)){
            let tempDist = 1e9;
            if (this.state == 0) tempDist = (key[0]+this.r-this.str)**2 + (key[1]+this.c-this.stc)**2;
            if (this.state == 1) tempDist = (key[0]+this.r-this.tr)**2 + (key[1]+this.c-this.tc)**2;
            if (tempDist < bestDistance){
              bestDirection = key;
              bestDistance = tempDist;
            }
          }
        })
        return [[bestDirection[0]+this.r, bestDirection[1]+this.c], bestDirection];
      }
  
      else{
        return [[this.dr+this.r, this.dc+this.c], [this.dr, this.dc]];
      }
    }

    static loadMesh(ghost, scene){
        // Load the OBJ file
        const loader = new OBJLoader();
        loader.load(
            './models/head.obj',
            (obj) => {
                const meshScaling = 0.1;
                obj.scale.set(meshScaling, meshScaling, meshScaling);
                obj.position.set(0, 0, 0);
                obj.rotation.x = -Math.PI/2;
                obj.traverse((child) => {
                    if (child.isMesh) {
                        // Apply a standard material to all meshes in the OBJ
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x00ff00,
                            emissive: 0x00ff00,
                            emissiveIntensity: 1.45,
                            roughness: 0.5,
                            metalness: 0.3
                        });
                    }
                });
                scene.remove(ghost.mesh);
                ghost.mesh = obj;
                scene.add(ghost.mesh);
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
        
    }

}