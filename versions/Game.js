import {Ghost} from "./Ghost.js"
import {Player} from "./Player.js"


// 17 x 19
export class Game{
    static maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1],
        [1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 3, 1, 2, 1, 2, 1, 1, 1, 3, 1, 2, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 1, 1, 3, 1, 2, 1, 2, 1, 1, 1, 3, 1, 2, 1, 2, 1],
        [1, 2, 1, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];

    constructor(scene){
        this.scene = scene;
        this.resetGame();
        this.chaseTimer = 20; // Seconds to stay in chase mode
        this.scatterTimer = 7; // Seconds to stay in scatter mode
        this.modeTimer = 0; // General timer for tracking state transitions
        this.currentMode = 1;
        this.isGameOver = false;
    }

    checkCollision() {
        const collisionRadius = 0.5; // Adjust as needed for proper collision detection
    
        for (const ghost of this.ghosts) {
            const distance = Math.sqrt(
                (ghost.r_ - this.player.r_) ** 2 +
                (ghost.c_ - this.player.c_) ** 2
            );
    
            if (distance < collisionRadius) {
                console.log("Collision detected with a ghost!");
                this.endGame();
                break;
            }
        }
    }
    
    endGame() {
        console.log("Game Over!");
        this.isGameOver = true; // Set the game-over flag
        const gameOverDiv = document.getElementById("game-over");
        if (gameOverDiv) {
            gameOverDiv.style.display = "block"; // Show the Game Over message
        }
    }
    
    
    
    


    updateGhostModes(dt) {
        this.modeTimer += dt;

        if (this.currentMode === 1 && this.modeTimer > this.chaseTimer) {
            this.switchToScatterMode();
        } else if (this.currentMode === 0 && this.modeTimer > this.scatterTimer) {
            this.switchToChaseMode();
        }
    }

    switchToChaseMode() {
        this.currentMode = 1;
        this.modeTimer = 0;
        this.ghosts.forEach((ghost) => (ghost.state = 1)); // Set all ghosts to chase mode
        console.log("Switched to Chase Mode");
    }

    switchToScatterMode() {
        this.currentMode = 0;
        this.modeTimer = 0;
        this.ghosts.forEach((ghost) => (ghost.state = 0)); // Set all ghosts to scatter mode
        console.log("Switched to Scatter Mode");
    }

    activateFrightenedMode() {
        this.ghosts.forEach((ghost) => (ghost.state = 2)); // Set all ghosts to frightened
        setTimeout(() => {
            this.ghosts.forEach((ghost) => (ghost.state = this.currentMode)); // Revert to current mode
        }, 10000); // Frightened mode lasts 10 seconds
    }

    resetGame() {
        // Initialize maze first to ensure it's available
        this.maze = this.resetMaze();
        console.log("Maze initialized:", this.maze);
    
        // Initialize ghosts with valid initial positions
        const redGhost = new Ghost(this, 12, 15, -10, 14);
        const pinkGhost = new Ghost(this, 7, 1, -10, 3);
        const blueGhost = new Ghost(this, 10, 1, 20, 1);
        const orangeGhost = new Ghost(this, 14, 15, 20, 15);
    
        // Assign targets for ghosts
        redGhost.setTarget(0, 0);
        pinkGhost.setTarget(0, 0);
        blueGhost.setTarget(0, 0);
        orangeGhost.setTarget(0, 0);
    
        // Assign initial directions
        redGhost.setDirection(-1, 0);  
        pinkGhost.setDirection(-1, 0);     
        blueGhost.setDirection(0, -1);   
        orangeGhost.setDirection(0, -1);
    
        // Set walking speeds for all ghosts
        redGhost.walkingSpeed = 4;
        pinkGhost.walkingSpeed = 3;
        blueGhost.walkingSpeed = 2;
        orangeGhost.walkingSpeed = 2;
    
        // Initialize player
        this.player = new Player(this, 7, 10, 0);
    
        // Assign ghosts to the game
        this.ghosts = [redGhost, pinkGhost, blueGhost, orangeGhost];
    
        // Trigger initial movement for ghosts
        this.ghosts.forEach((ghost) => {
            try {
                const [position, direction] = ghost.nextPosition();
                ghost.setDirection(direction[0], direction[1]);
                ghost.walking = true;
            } catch (error) {
                console.error(`Error initializing ghost @ (${ghost.r}, ${ghost.c}):`, error);
            }
        });
    
        // Update ghost targets after initialization
        this.updateGhostTargets();
    }
    

    resetMaze(){
        this.maze = [];
        for (let r=0; r<Game.maze.length; r++){
            const temp=[];
            for (let c=0; c<Game.maze[r].length; c++) temp.push(Game.maze[r][c]);
            this.maze.push(temp);
        }
        return this.maze;
    }

    isWall(r, c){
        return this.maze[r][c] == 1;
    }

    updateGhostTargets(){
        // set red ghost to player
        this.ghosts[0].tr = this.player.r;
        this.ghosts[0].tc = this.player.c;

        // set pink ghost to ahead of player
        this.ghosts[1].tr = this.player.r + this.player.dr * 4;
        this.ghosts[1].tc = this.player.c + this.player.dc * 4;

        // set blue ghost to 2*(red to (pacman + 2direction)) + red position
        const pacTempR = this.player.r + (this.player.dr * 2);
        const pacTempC = this.player.c + (this.player.dc * 2);
        const redToPacR = pacTempR - this.ghosts[0].r;
        const redToPacC = pacTempC - this.ghosts[0].c;
        this.ghosts[2].tr = (2 * redToPacR) + this.ghosts[0].r;
        this.ghosts[2].tc = (2 * redToPacC) + this.ghosts[0].c;    

        // set orange ghost based on proximty
        const orangeDistance = (this.player.r - this.ghosts[3].r) ** 2 + (this.player.c - this.ghosts[3].c) ** 2;
        const redDR = this.player.r - this.ghosts[0].r;
        const redDC = this.player.c - this.ghosts[0].c;
        this.ghosts[3].tr = (2 * redDR) + this.ghosts[0].r;
        this.ghosts[3].tc = (2 * redDC) + this.ghosts[0].c; 
        if (orangeDistance < 64){
            this.ghosts[3].tr = this.ghosts[3].str;
            this.ghosts[3].tc = this.ghosts[3].stc;
        }
    }

    playerMoved(player){
        //console.log("player moved!");
    }

    ghostMoved(ghost){
        //console.log("ghost moved!");
    }


}