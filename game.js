let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let wallY = 0;

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

let coins = [];
let runCoins = 0;
let gameState = "START";
let score = 0;
let bestScore = sessionStorage.getItem('skyIslandBest') || 0;
let maxAltitude = 0;
let shakeTime = 0;
let particles = [];
let stars = [];
for (let i = 0; i < 60; i++) {
    stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.4 + 1 //for 3d effect
    });
}
let powerups = [];
let lasers = [];
let birds = [];

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'PLAYING') {
        lasers.push({ x: player.x + player.width/2 - 2, y: player.y, vy: -15 });
        playSound('laser');
    }
});

class Bird {
    constructor(y) {
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.isMovingRight = Math.random() > 0.5;
        this.x = this.isMovingRight ? -50 : GAME_WIDTH + 50;
        this.vx = (this.isMovingRight ? 1 : -1) * (2 + Math.random() * 3);
        this.isDead = false;
    }
    update() {
        this.x += this.vx;
    }
    draw(ctx) {
        if (this.isDead) return;
        ctx.fillStyle = '#e67357';
        ctx.beginPath();
        if (this.isMovingRight) {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height/2);
            ctx.lineTo(this.x, this.y + this.height);
        } else {
            ctx.moveTo(this.x + this.width, this.y);
            ctx.lineTo(this.x, this.y + this.height/2);
            ctx.lineTo(this.x + this.width, this.y + this.height);
        }
        ctx.fill();
    }
}

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

    } else if (type === 'laser') { 
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
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
    gravity: 0.8, vx: 0, 
    speed: 9,
    jumpForce: -17,
    jetpackTime: 0
};

let platforms = [];

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.size = Math.random() * 8 + 4;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
    draw(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

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
    maxAltitude = 0;
    coins = [];
    runCoins = 0;
    wallY = GAME_HEIGHT + 300;
    birds = [];
    lasers = [];
    powerups = [];
    player.jetpackTime = 0;
    scoreDisplay.innerText = score;
    document.getElementById('hud-coins').innerText = runCoins;

    player.x = GAME_WIDTH / 2 - 20;
    player.y = GAME_HEIGHT / 2;
    player.vy = 0;

    generateStartingPlatforms();

    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
}
startBtn.addEventListener('click', () => {
    playSound('jump');
    startScreen.classList.add('zoom-in');

    setTimeout(() => {
        startScreen.classList.add('hidden');
        startGame();
    }, 800);
});
restartBtn.addEventListener('click', startGame);

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.save();
    if (shakeTime > 0) {
        let dx = (Math.random() - 0.5) * 15;
        let dy = (Math.random() - 0.5) * 15;
        ctx.translate(dx, dy);
        shakeTime--;
    }

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

        if (player.jetpackTime > 0) {
            player.vy = -25;
            player.jetpackTime--;
            shakeTime = 2;
            spawnParticles(player.x + 20, player.y + player.height, '#00f0ff', 4);
        } else {
            player.vy += player.gravity;
        }
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
                        shakeTime = 8;
                        spawnParticles(player.x, player.y + player.height, '#80ed99', 15);
                        playSound('jump');
                    } else {
                        player.vy = player.jumpForce;
                        spawnParticles(plat.x + plat.width/2, plat.y, '#8387a7', 5);
                        playSound('jump');
                    }
                    if (plat.type === 2) {
                        plat.isBroken = true;
                        spawnParticles(plat.x + plat.width/2, plat.y, '#a6b1e1', 20);
                    }
                }
            });
         }

        if (player.y < GAME_HEIGHT / 2) {
            let diff = (GAME_HEIGHT / 2) - player.y;
            player.y += diff;

            maxAltitude += diff;

            wallY += diff * 0.8;

            stars.forEach(star => {
                star.y += diff * star.speed;
                if (star.y > GAME_HEIGHT) {
                    star.y = 0;
                    star.x = Math.random() * GAME_WIDTH;
                }
            });
            //shift in skky colors
            let lightness = Math.max(10, 75 - (maxAltitude / 200));
            let hue = (200 + (maxAltitude / 100)) % 360;

            document.getElementById('sky-background').style.background = 
            `linear-gradient(to bottom, hsl(${hue}, 50%, 10%), hsl(${hue}, 40%, ${lightness}%))`;

            let calculatedScore = Math.floor(maxAltitude / 10);
            if (calculatedScore > score) {
                score = calculatedScore;
                scoreDisplay.innerText = score;
                if (score > bestScore) {
                    bestScore = score;
                    sessionStorage.setItem('skyIslandBest', bestScore);
                }
            }

            powerups.forEach(p => { p.y += diff; });
            coins.forEach(c => { c.y += diff; });
            platforms.forEach(plat => {
                plat.y += diff;
            });
            birds.forEach(bird => {
                bird.y += diff;
            });
                
            let highestPlatform = platforms[platforms.length - 1];
            if (highestPlatform.y > 0) {
                let randomX = Math.random() * (GAME_WIDTH - 100);
                platforms.push(new Platform(randomX, highestPlatform.y - 120, getRandomType()));
                
            if (Math.random() < 0.05) {
                powerups.push({ x: randomX + 40, y: highestPlatform.y - 180, active: true });
            }
            if (Math.random() < 0.30) {
                coins.push({ x: randomX + 40, y: highestPlatform.y - 40, active: true, angle: 0 });
            }

                let birdChance = 0.02 + Math.min(score / 500, 1) * 0.38;
                if (Math.random() < birdChance) {
                    birds.push(new Bird(Math.random() * (GAME_HEIGHT / 2)));
                }
            }
        }
        // --- enemies entry
        lasers.forEach(laser => laser.y += laser.vy);
        
        birds.forEach(bird => {
            bird.update();
            
            lasers.forEach(laser => {
                if (!bird.isDead && laser.x > bird.x && laser.x < bird.x + bird.width &&
                    laser.y < bird.y + bird.height && laser.y > bird.y) {
                    
                    bird.isDead = true;
                    laser.y = -999; 
                    spawnParticles(bird.x + bird.width/2, bird.y, '#e67357', 20);
                    shakeTime = 5;
                    score += 50; // Bonus points
                    scoreDisplay.innerText = score;
                }
            });

            if (!bird.isDead && player.x < bird.x + bird.width && 
                player.x + player.width > bird.x &&
                player.y < bird.y + bird.height &&
                player.y + player.height > bird.y) {
                
                // death..
            if (player.jetpackTime > 0) {
                bird.isDead = true;
                spawnParticles(bird.x + bird.width/2, bird.y, '#e67357', 20);
            } else {
                gameState = "GAMEOVER";
                hud.classList.add('hidden');
                gameOverScreen.classList.remove('hidden');

                finalScoreDisplay.innerText = score;
                document.getElementById('best-score').innerText = bestScore;

                shakeTime = 20;
                spawnParticles(player.x, player.y, '#FF007F', 40);
                playSound('death');
            }
            }
        });
        wallY -= 0.5;
        if (player.y + player.height > wallY) {
            player.y = GAME_HEIGHT + 100;
        }

        // --- d by fallin
        if (player.y > GAME_HEIGHT) {
            gameState = "GAMEOVER";
            hud.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
            finalScoreDisplay.innerText = score;
            document.getElementById('best-score').innerText = bestScore;
            shakeTime = 20;
            spawnParticles(player.x, player.y, '#FF007F', 40);
            playSound('death');
        }
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    platforms = platforms.filter(plat => plat.y < GAME_HEIGHT + 100);
    platforms.forEach(plat => plat.draw(ctx));

    ctx.fillStyle = '#FF007F';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = 'rgba(255, 0, 50, 0.4)';
    ctx.fillRect(0, wallY, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#ff0032';
    ctx.fillRect(0, wallY, GAME_WIDTH, 5);

    powerups.forEach(p => {
        if (!p.active) return;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(p.x, p.y, 20, 20);
        ctx.shadowBlur = 0;

        if (player.x < p.x + 20 && player.x + player.width > p.x && 
        player.y < p.y + 20 && player.y + player.height > p.y) {
            p.active = false;
            player.jetpackTime = 120;
            playSound('jump');
         }
    });


    birds.forEach(b => b.draw(ctx));
    lasers.forEach(l => {
        ctx.fillStyle = '#80ed99';
        ctx.fillRect(l.x, l.y, 4, 15);
    });

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.draw(ctx));

    //--coins
    coins.forEach(c => {
        if (!c.active) return;
        c.angle += 0.1;

        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFA500';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        ctx.ellipse(c.x, c.y, Math.max(1, 10 * Math.abs(Math.cos(c.angle))), 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (player.x < c.x + 10 && player.x + player.width > c.x - 10 &&
            player.y < c.y + 15 && player.y + player.height > c.y - 15) {
                c.active = false;
                runCoins++;
                document.getElementById('hud-coins').innerText = runCoins;
                playSound('coin');
            }
    });
    coins = coins.filter(c => c.active && c.y < GAME_HEIGHT + 100);

    ctx.restore();

    requestAnimationFrame(gameLoop);
}
gameLoop();

for (let i = 0; i < 40; i++) {
    let r = document.createElement('div');
    r.className = 'rock-shape';

    r.style.left = (Math.random() * 120 - 10) + '%';
    r.style.top = (Math.random() * 120 - 10) + '%';
    r.style.width = (Math.random() * 80 + 40) + 'px';
    r.style.height = (Math.random() * 80 + 40) + 'px';

    let colors = ['#8397a7', '#e67357', '#a6b1e1', '#80ed99'];
    r.style.background = colors[Math.floor(Math.random() * colors.length)];
    r.style.transform = `rotate(${Math.random() * 360}deg)`;
    startScreen.appendChild(r);
}