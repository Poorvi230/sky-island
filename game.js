let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false, d: false,
};
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});
window.addEventListener('touchstart', (e) => {
    let touchX = e.touches[0].clientX;

    if (touchX < GAME_WIDTH / 2) {
        keys.ArrowLeft = true;
    } else {
        keys.ArrowRight = true;
    }
});
window.addEventListener('touchend', (e) => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
});

let startScreen = document.getElementById('start-screen');
let gameOverScreen = document.getElementById('game-over-screen');
let hud = document.getElementById('hud');
let scoreDisplay = document.getElementById('score');
let finalScoreDisplay = document.getElementById('final-score');

let startBtn = document.getElementById('start-btn');
let restartBtn= document.getElementById('restart-btn');

let gameState = "START";
let score = 0;
let maxAltitude = 0;

//--sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

let GAME_WIDTH = canvas.parentElement.clientWidth;
let GAME_HEIGHT = canvas.parentElement.clientHeight;

//not mobile friendly mann
function resize() {
    GAME_WIDTH = canvas.parentElement.clientWidth;
    GAME_HEIGHT = canvas.parentElement.clientHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}
window.addEventListener('resize', resize);
resize();

let player = {
    x: GAME_WIDTH / 2 - 20,
    y: 100,
    width: 40, height: 40, vy: 0,
    gravity: 0.4, vx: 0, 
    speed: 6,
    jumpForce: -13
};

let platforms = [];

class Platform {
    constructor(x, y, type = 0) {
        this.x = x; this.y = y;
        this.width = 100;
        this.height = 20;
        this.type = type; //0 is normal, 1=moving, 2=fragile, 3=bouncing

        this.vx = (Math.random() > 0.5 ? 2 : -2);
        this.isBroken = false;
    }
    update() {
        if (this.type === 1) {
            this.x += this.vx;
            if (this.x < 0 || this.x + this.width > GAME_WIDTH) {
                this.vx *= -1;
            }
        }
    }
    draw(ctx) {
        if (this.isBroken) return;

        if (this.type === 0) ctx.fillStyle = '#8397a7'; //normal rock
        if (this.type === 1) ctx.fillStyle = '#e67357'; //moving
        if (this.type === 2) ctx.fillStyle = '#a6b1e1'; //fragile
        if (this.type === 3) ctx.fillStyle = '#80ed99'; //bouncing

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + 4);
        ctx.lineTo(this.x + this.width - 8, this.y + this.height);
        ctx.lineTo(this.x + 12, this.y + this.height + 6);
        ctx.closePath();
        ctx.fill();
    }
}
function getRandomType() {
    let r = Math.random();
    if (r < 0.70) return 0;
    if (r < 0.80) return 1;
    if (r < 0.90) return 2;
    return 3;
}

function generateStartingPlatforms() {
    platforms = [];
    platforms.push(new Platform(GAME_WIDTH / 2 - 50, GAME_HEIGHT - 50));

    let currentY = GAME_HEIGHT - 150;

    while(currentY > 0) {
        let randomX = Math.random() * (GAME_WIDTH - 100);
        platforms.push(new Platform(randomX, currentY, getRandomType()));

        currentY -= Math.random() * 60 + 80;
    }
}
generateStartingPlatforms();

function startGame() {
    gameState = "PLAYING";
    score = 0;
    scoreDisplay.innerText = score;

    player.x = GAME_WIDTH / 2 - 20;
    player.y = GAME_HEIGHT / 2;
    player.vy = 0;

    generateStartingPlatforms();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
}
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState === "PLAYING") {

        player.vx = 0;
        if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
        if (keys.ArrowRight || keys.d) player.vx = player.speed;

        player.x += player.vx;

        if (player.x > GAME_WIDTH) {
                player.x = -player.width;
        } else if (player.x + player.width < 0) {
                player.x = GAME_WIDTH;
        }

        player.vy += player.gravity;
        platforms.forEach(plat => plat.update());

        player.y += player.vy;

        if (player.vy > 0) {
            platforms.forEach(plat => {
                if (!plat.isBroken && player.x  < plat.x + plat.width &&
                    player.x + player.width > plat.x &&
                    player.y + player.height > plat.y &&
                    player.y + player.height < plat.y + plat.height + player.vy) {

                    player.y = plat.y - player.height;
                    
                    if (plat.type === 3) {
                        player.vy = player.jumpForce * 1.5;
                        playSound('jump');
                    } else {
                        player.vy = player.jumpForce;
                        playSound('jump');
                    }
                    if (plat.type === 2) {
                        plat.isBroken = true;
                    }
                }
            });
         }

        if (player.y < GAME_HEIGHT / 2) {
            let diff = (GAME_HEIGHT / 2) - player.y;
            player.y += diff;

            maxAltitude += diff;

            let calculatedScore = Math.floor(maxAltitude / 10);
            if (calculatedScore > score) {
                score = calculatedScore;
                scoreDisplay.innerText = score;
            }

            platforms.forEach(plat => {
                plat.y += diff;
            });
                
            let highestPlatform = platforms[platforms.length - 1];
            if (highestPlatform.y > 0) {
                let randomX = Math.random() * (GAME_WIDTH - 100);
                platforms.push(new Platform(randomX, highestPlatform.y - 120, getRandomType()));
            }
        }
        if (player.y > GAME_HEIGHT) {
            gameState = "GAMEOVER";
            hud.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
            finalScoreDisplay.innerText = score;
            playSound('death');
        }
    }
    platforms = platforms.filter(plat => plat.y < GAME_HEIGHT + 100);
    platforms.forEach(plat => plat.draw(ctx));

    ctx.fillStyle = '#FF007F';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}
gameLoop();