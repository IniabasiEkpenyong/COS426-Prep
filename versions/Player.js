import * as THREE from 'three';

export class Player{
    static rotSpeed = 2;
    static moveSpeed = 2;

    constructor(game, r, c, dir=0){
        this.game = game;
        
        // the grid position player occupies
        this.r = r;
        this.c = c;
        
        // the actual world position player occupies
        this.r_ = r;
        this.c_ = c;

        // the direction player is pointed in 
        this.dir = dir;

        // player mesh
        this.geometry = new THREE.SphereGeometry(0.5,10,10);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1.45,
            roughness: 0.5,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    gridCell(r, c){
        // check whether to round up or down (JS is funky with % to be careful)
        return [Math.round(r), Math.round(c)];
    }

    rotateLeft(dt){
        this.dir -= Player.rotSpeed * dt; 
    }

    rotateRight(dt){
        this.dir += Player.rotSpeed * dt;
    }

    // MAKE THE MOVEMENT BETTER!!!
    moveForward(dt){
        // check position if moved in 
        let nr_ = this.r_ + Math.sin(this.dir) * Player.moveSpeed * dt;
        let nc_ = this.c_ + Math.cos(this.dir) * Player.moveSpeed * dt;
        let [nr, nc] = this.gridCell(nr_, nc_);

        //console.log("At r ", this.r, " c ", this.c);
        //console.log("At r_", this.r_, " c_ ", this.c_);
        //console.log("At nr ", nr, " c ", nc);
        //console.log("At nr_", nr_, " c_ ", nc_);

        // if wall exit else move (need extra range else clips a little into it)
        if (this.game.isWall(nr, nc)) return;
        
        // tell the game the player moved
        let movedCell = (nr != this.r || nc != this.c);

        // update positions
        this.r_ = nr_;
        this.c_ = nc_;
        this.r = nr;
        this.c = nc;

        if (movedCell) this.game.playerMoved(this);
    }

    moveBackward(dt){
        // check position if moved in 
        let nr_ = this.r_ - Math.sin(this.dir) * Player.moveSpeed * dt;
        let nc_ = this.c_ - Math.cos(this.dir) * Player.moveSpeed * dt;
        let [nr, nc] = this.gridCell(nr_, nc_);

        // if wall exit else move (need extra range else clips a little into it)
        if (this.game.isWall(nr, nc)) return;
        
        // tell the game the player moved
        let movedCell = (nr != this.r || nc != this.c);

        // update positions
        this.r_ = nr_;
        this.c_ = nc_;
        this.r = nr;
        this.c = nc;

        if (movedCell) this.game.playerMoved(this);
    }
}