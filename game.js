let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

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
    width: 40, height: 40, vy: 0, gravity: 0.4
};

function gameLoop() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    player.vy += player.gravity;
    player.y += player.vy;

    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}
gameLoop();