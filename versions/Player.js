import * as THREE from 'three';

export class Player {
    static rotSpeed = 2;
    static moveSpeed = 2;
    static smoothingFactor = 10; // Higher value = smoother transition

    constructor(game, r, c, dir = 0) {
        this.game = game;

        // The grid position player occupies
        this.r = r;
        this.c = c;

        // The actual world position player occupies
        this.r_ = r;
        this.c_ = c;

        // The direction player is pointed in (in radians)
        this.dir = dir;

        // Target positions for smooth interpolation
        this.target_r_ = r;
        this.target_c_ = c;

        // Target direction for smooth rotation
        this.targetDir = dir;

        // Player mesh
        this.geometry = new THREE.SphereGeometry(0.3, 10, 10);
        this.material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1.45,
            roughness: 0.5,
            metalness: 0.3,
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    gridCell(r, c) {
        return [Math.round(r), Math.round(c)];
    }

    rotateLeft(dt) {
        this.targetDir -= Player.rotSpeed * dt;
    }

    rotateRight(dt) {
        this.targetDir += Player.rotSpeed * dt;
    }

    moveForward(dt) {
        const newTargetR_ = this.target_r_ + Math.sin(this.dir) * Player.moveSpeed * dt;
        const newTargetC_ = this.target_c_ + Math.cos(this.dir) * Player.moveSpeed * dt;
        const [newR, newC] = this.gridCell(newTargetR_, newTargetC_);

        if (this.game.isWall(newR, newC)) return;

        // Update target positions
        this.target_r_ = newTargetR_;
        this.target_c_ = newTargetC_;
    }

    moveBackward(dt) {
        const newTargetR_ = this.target_r_ - Math.sin(this.dir) * Player.moveSpeed * dt;
        const newTargetC_ = this.target_c_ - Math.cos(this.dir) * Player.moveSpeed * dt;
        const [newR, newC] = this.gridCell(newTargetR_, newTargetC_);

        if (this.game.isWall(newR, newC)) return;

        // Update target positions
        this.target_r_ = newTargetR_;
        this.target_c_ = newTargetC_;
    }

    updatePosition(dt) {
        // Smoothly interpolate positions
        this.r_ += (this.target_r_ - this.r_) * Player.smoothingFactor * dt;
        this.c_ += (this.target_c_ - this.c_) * Player.smoothingFactor * dt;

        // Snap to grid position if close enough
        const [gridR, gridC] = this.gridCell(this.r_, this.c_);
        if (Math.abs(this.r_ - gridR) < 0.05 && Math.abs(this.c_ - gridC) < 0.05) {
            this.r = gridR;
            this.c = gridC;
            this.r_ = gridR;
            this.c_ = gridC;
        }

        // Smoothly interpolate rotation
        this.dir += (this.targetDir - this.dir) * Player.smoothingFactor * dt;
    }
}
