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
    speed: 6
};

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    player.vx = 0;
    if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
    if (keys.ArrowRight || keys.d) player.vx = player.speed;
    
    player.x += player.vx

    player.vy += player.gravity;
    player.y += player.vy;

    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}
gameLoop();