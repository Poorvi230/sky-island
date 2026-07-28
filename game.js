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
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = 100;
        this.height = 20;
    }
    draw(ctx) {
        ctx.fillStyle = '#8397a7';

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + 4);

        ctx.lineTo(this.x + this.width - 8, this.y + this.height);

        ctx.lineTo(this.x + 12, this.y + this.height + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#c1c9ce';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + 4);
        ctx.lineTo(this.x + this.width - 5, this.y + 8);
        ctx.lineTo(this.x + 5, this.y + 5);
        ctx.closePath();
        ctx.fill();
    }
}
function generateStartingPlatforms() {
    platforms = [];
    platforms.push(new Platform(GAME_WIDTH / 2 - 50, GAME_HEIGHT - 50));

    let currentY = GAME_HEIGHT - 150;

    while(currentY > 0) {
        let randomX = Math.random() * (GAME_WIDTH - 100);
        platforms.push(new Platform(randomX, currentY));

        currentY -= Math.random() * 60 + 80;
    }
}
generateStartingPlatforms();

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    player.vx = 0;
    if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
    if (keys.ArrowRight || keys.d) player.vx = player.speed;

    player.x += player.vx

    if (player.x > GAME_WIDTH) {
        player.x = -player.width;
    } else if (player.x + player.width < 0) {
        player.x = GAME_WIDTH;
    }

    player.vy += player.gravity;
    player.y += player.vy;

    if (player.vy > 0) {
        platforms.forEach(plat => {
            if (player.x < plat.x + plat.width && 
                player.x + player.width > plat.x &&
                player.y + player.height > plat.y &&
                player.y + player.height < plat.y + plat.height + player.vy) {

            player.y = plat.y - player.height;
            player.vy = player.jumpForce;
                }
        });
    }

    ctx.fillStyle = '#ff6b6b';
    
    if (player.y < GAME_HEIGHT / 2) {
        let diff = (GAME_HEIGHT / 2) - player.y;
        player.y += diff;

        platforms.forEach(plat => {
            plat.y += diff;
        });
        let highestPlatform = platforms[platforms.length - 1];
        if (highestPlatform.y > 0) {
            let randomX = Math.random() * (GAME_WIDTH - 100);
            platforms.push(new Platform(randomX, highestPlatform.y - 120));
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