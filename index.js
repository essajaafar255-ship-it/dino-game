const canvas = document.getElementById("dinoCanvas");
const ctx = canvas.getContext("2d");

const godModeCheck = document.getElementById("godModeToggle");
const autoJumpCheck = document.getElementById("autoJumpToggle");
const addScoreBtn = document.getElementById("addScoreBtn");

const GRAVITY = 0.6;
let gameSpeed = 6;
const INITIAL_SPEED = 6;
let score = 0;
let highScore = 0;
let gameFrame = 0;
let nextObstacleFrame = 120;
let isGameOver = false;
let isStarted = false;
let nightMode = false;

window.addEventListener("keydown", (e) => {
    if (e.code === "KeyH") godModeCheck.checked = !godModeCheck.checked;
    if (e.code === "KeyA") autoJumpCheck.checked = !autoJumpCheck.checked;
});

addScoreBtn.addEventListener("click", () => {
    if (isStarted && !isGameOver) { score += 1000; playSound('score'); }
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        if (type === 'jump') {
            osc.type = 'square'; osc.frequency.setValueAtTime(750, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'score') {
            osc.type = 'square'; osc.frequency.setValueAtTime(950, audioCtx.currentTime);
            osc.frequency.setValueAtTime(1300, audioCtx.currentTime + 0.07);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.22);
            osc.start(); osc.stop(audioCtx.currentTime + 0.22);
        } else if (type === 'hit') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, audioCtx.currentTime + 0.35);
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);
            osc.start(); osc.stop(audioCtx.currentTime + 0.35);
        }
    } catch(e) {}
}

const dino = {
    x: 50, y: 114, width: 44, height: 47, standHeight: 47, duckHeight: 30,
    vy: 0, jumpForce: -10, isJumping: false, isDucking: false, legFrameToggle: false,
    update() {
        this.vy += GRAVITY; this.y += this.vy;
        let groundLevel = 114;
        if (this.isDucking && !this.isJumping) groundLevel = 114 + (this.standHeight - this.duckHeight);
        if (this.y > groundLevel) { this.y = groundLevel; this.vy = 0; this.isJumping = false; }
        if (gameFrame % 6 === 0) this.legFrameToggle = !this.legFrameToggle;
    },
    draw() {
        ctx.fillStyle = nightMode ? "#e8eaed" : "#535353";
        if (isGameOver) { ctx.fillRect(this.x, this.y, this.width, this.height); return; }
        if (this.isDucking && !this.isJumping) {
            ctx.fillRect(this.x, this.y, 59, this.duckHeight);
            ctx.fillStyle = nightMode ? "#202124" : "#f7f7f7";
            if (this.legFrameToggle) ctx.fillRect(this.x + 15, this.y + 25, 8, 5);
            else ctx.fillRect(this.x + 35, this.y + 25, 8, 5);
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            if (!this.isJumping) {
                ctx.fillStyle = nightMode ? "#202124" : "#f7f7f7";
                if (this.legFrameToggle) ctx.fillRect(this.x + 10, this.y + 35, 10, 15);
                else ctx.fillRect(this.x + 25, this.y + 35, 10, 15);
            }
        }
    }
};

class Obstacle {
    constructor(type) {
        this.type = type; this.x = 620;
        if (type === 'cactus_small') { this.width = 20; this.height = 36; this.y = 150 - this.height - 12; }
        else if (type === 'cactus_large') { this.width = 25; this.height = 48; this.y = 150 - this.height - 12; }
        else if (type === 'pterodactyl') {
            this.width = 40; this.height = 28;
            const elevations =;
            this.y = elevations[Math.floor(Math.random() * elevations.length)];
            this.wingState = false;
        }
    }
    update(speed) {
        this.x -= speed;
        if (this.type === 'pterodactyl' && gameFrame % 14 === 0) this.wingState = !this.wingState;
    }
    draw() {
        ctx.fillStyle = nightMode ? "#e8eaed" : "#535353";
        if (this.type === 'pterodactyl') {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = nightMode ? "#202124" : "#f7f7f7";
            if (this.wingState) ctx.fillRect(this.x, this.y, 14, 10);
            else ctx.fillRect(this.x + 24, this.y + 16, 14, 10);
        } else { ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
}

let obstacles = [];
const activeKeys = {};

window.addEventListener("keydown", (e) => {
    activeKeys[e.code] = true;
    if (e.code === "Space" || e.code === "ArrowUp") {
        if (!isStarted) { isStarted = true; loop(); return; }
        if (isGameOver) { resetGame(); }
        else if (!dino.isJumping && !dino.isDucking) { dino.vy = dino.jumpForce; dino.isJumping = true; playSound('jump'); }
    }
    if (e.code === "ArrowDown" && isStarted && !isGameOver) dino.isDucking = true;
});

window.addEventListener("keyup", (e) => {
    activeKeys[e.code] = false;
    if (e.code === "ArrowDown") dino.isDucking = false;
});

function resetGame() {
    obstacles = []; score = 0; gameFrame = 0; gameSpeed = INITIAL_SPEED;
    isGameOver = false; nightMode = false; document.body.classList.remove("dark-mode");
    dino.y = 114; dino.vy = 0; dino.isJumping = false; dino.isDucking = false;
    nextObstacleFrame = gameFrame + 60; loop();
}

function loop() {
    if (isGameOver || !isStarted) return;
    gameFrame++;
    gameSpeed = INITIAL_SPEED + Math.floor(score / 100) * 0.25;

    if (score > 0 && score % 700 === 0 && gameFrame % 100 === 0) {
        nightMode = !nightMode; document.body.classList.toggle("dark-mode", nightMode);
    }

    if (gameFrame % 5 === 0) {
        score++;
        if (score % 100 === 0) playSound('score');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = nightMode ? "#e8eaed" : "#535353"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 142); ctx.lineTo(600, 142); ctx.stroke();

    if (autoJumpCheck.checked && obstacles.length > 0) {
        const target = obstacles[0];
        if (target.x - dino.x < 120 + (gameSpeed * 2)) {
            if (target.type === 'pterodactyl' && target.y === 65) dino.isDucking = true;
            else if (target.type === 'pterodactyl' && target.y === 40) dino.isDucking = false;
            else {
                dino.isDucking = false;
                if (!dino.isJumping) { dino.vy = dino.jumpForce; dino.isJumping = true; playSound('jump'); }
            }
        } else if (dino.isDucking && !activeKeys["ArrowDown"]) dino.isDucking = false;
    }

    if (gameFrame >= nextObstacleFrame) {
        const hazardPool = ['cactus_small', 'cactus_large'];
        if (score > 350) hazardPool.push('pterodactyl');
        obstacles.push(new Obstacle(hazardPool[Math.floor(Math.random() * hazardPool.length)]));
        nextObstacleFrame = gameFrame + Math.floor(Math.random() * 50) + 50;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update(gameSpeed); obstacles[i].draw();
        let w = dino.isDucking ? 59 : dino.width;
        let h = dino.isDucking ? dino.duckHeight : dino.height;

        if (!godModeCheck.checked) {
            if (dino.x < obstacles[i].x + obstacles[i].width && dino.x + w > obstacles[i].x && dino.y < obstacles[i].y + obstacles[i].height && dino.y + h > obstacles[i].y) {
                isGameOver = true; playSound('hit'); if (score > highScore) highScore = score;
            }
        }
        if (obstacles[i].x < -60) obstacles.splice(i, 1);
    }

    dino.update(); dino.draw();

    ctx.fillStyle = nightMode ? "#e8eaed" : "#535353"; ctx.font = "12px 'Courier New'";
    let badge = godModeCheck.checked ? "GOD " : "";
    if (autoJumpCheck.checked) badge += "AUTO ";
    ctx.fillText(`${badge}HI ${String(highScore).padStart(5, '0')} ${String(score).padStart(5, '0')}`, 410, 25);

    requestAnimationFrame(loop);

    if (isGameOver) {
        ctx.fillStyle = nightMode ? "#e8eaed" : "#535353"; ctx.font = "bold 16px 'Courier New'";
        ctx.fillText("G A M E  O V E R", 220, 65); ctx.font = "24px sans-serif"; ctx.fillText("↻", 288, 95);
    }
}

ctx.fillStyle = "#535353"; ctx.font = "14px 'Courier New'";
ctx.fillText("Press SPACEBAR to Start Game", 180, 75);
dino.draw();
