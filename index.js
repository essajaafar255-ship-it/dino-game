this.width = 25;
this.height = 48;
this.y = 150 - this.height - 12;
} else if (type === 'pterodactyl') {
this.width = 40;
this.height = 28;
// Lane elevations: 0 = high flyer, 1 = mid neck tier, 2 = low floor tier
const elevations =;
this.y = elevations[Math.floor(Math.random() * elevations.length)];
this.wingState = false;
}
}
update(speed) {
this.x -= speed;
if (this.type === 'pterodactyl' && gameFrame % 14 === 0) {
this.wingState = !this.wingState;
}
}
draw() {
ctx.fillStyle = nightMode ? "#e8eaed" : "#535353";
if (this.type === 'pterodactyl') {
ctx.fillRect(this.x, this.y, this.width, this.height);
ctx.fillStyle = nightMode ? "#202124" : "#f7f7f7";
if (this.wingState) {
ctx.fillRect(this.x, this.y, 14, 10);
} else {
ctx.fillRect(this.x + 24, this.y + 16, 14, 10);
}
} else {
ctx.fillRect(this.x, this.y, this.width, this.height);
}
}
}
let obstacles = [];
// Controller Event Hooks
const activeKeys = {};
window.addEventListener("keydown", (e) => {
activeKeys[e.code] = true;
if (e.code === "Space" || e.code === "ArrowUp") {
if (!isStarted) {
isStarted = true;
loop();
return;
}
if (isGameOver) {
resetGame();
} else if (!dino.isJumping && !dino.isDucking) {
dino.vy = dino.jumpForce;
dino.isJumping = true;
playSound('jump');
}
}
if (e.code === "ArrowDown" && isStarted && !isGameOver) {
dino.isDucking = true;
}
});
window.addEventListener("keyup", (e) => {
activeKeys[e.code] = false;
if (e.code === "ArrowDown") {
dino.isDucking = false;
}
});
function resetGame() {
obstacles = [];
score = 0;
gameFrame = 0;
gameSpeed = INITIAL_SPEED;
isGameOver = false;
nightMode = false;
document.body.classList.remove("dark-mode");
dino.y = 114;
dino.vy = 0;
dino.isJumping = false;
dino.isDucking = false;
nextObstacleFrame = gameFrame + 60;
loop();
}
// Central Loop Execution Function
function loop() {
if (isGameOver || !isStarted) return;
gameFrame++;
// Dynamically scale game engine speed step multipliers over distance
gameSpeed = INITIAL_SPEED + Math.floor(score / 100) * 0.25;
// Environmental inversion routine every 700 points
if (score > 0 && score % 700 === 0 && gameFrame % 100 === 0) {
nightMode = !nightMode;
document.body.classList.toggle("dark-mode", nightMode);
}
if (gameFrame % 5 === 0) {
score++;
if (score % 100 === 0) {
playSound('score');
}
}
ctx.clearRect(0, 0, canvas.width, canvas.height);
// Render Skyline Ground Base Vector
ctx.strokeStyle = nightMode ? "#e8eaed" : "#535353";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(0, 142);
ctx.lineTo(600, 142);
ctx.stroke();
// AI Auto-Player Bot Loop Logic Check
if (autoJumpCheck.checked && obstacles.length > 0) {
const target = obstacles[0];
// Predict obstacle collision threats based on closing speed metrics
if (target.x - dino.x < 120 + (gameSpeed * 2)) {
if (target.type === 'pterodactyl' && target.y === 65) {
// Threat is mid-air flight tier: Hold duck
dino.isDucking = true;
} else if (target.type === 'pterodactyl' && target.y === 40) {
// Threat is high-air: Safe to completely ignore
dino.isDucking = false;
} else {
// Threat is a cactus or ground tracker: Execute clean jumps
dino.isDucking = false;
if (!dino.isJumping) {
dino.vy = dino.jumpForce;
dino.isJumping = true;
playSound('jump');
}
}
} else if (dino.isDucking && !activeKeys["ArrowDown"]) {
// Safe reset when hazard window closes down
dino.isDucking = false;
}
}
// Spawn Cycle Control System
if (gameFrame >= nextObstacleFrame) {
const hazardPool = ['cactus_small', 'cactus_large'];
if (score > 350) hazardPool.push('pterodactyl');
const rollingSelection = hazardPool[Math.floor(Math.random() * hazardPool.length)];
obstacles.push(new Obstacle(rollingSelection));
nextObstacleFrame = gameFrame + Math.floor(Math.random() * 50) + 50;
}
// Process, Loop & Splice active Obstacles Array stack
for (let i = obstacles.length - 1; i >= 0; i--) {
obstacles[i].update(gameSpeed);
obstacles[i].draw();
let w = dino.isDucking ? 59 : dino.width;
let h = dino.isDucking ? dino.duckHeight : dino.height;
// Precision Hitbox Calculations (Skipped inside God Mode)
if (!godModeCheck.checked) {
if (
dino.x < obstacles[i].x + obstacles[i].width &&
dino.x + w > obstacles[i].x &&
dino.y < obstacles[i].y + obstacles[i].height &&
dino.y + h > obstacles[i].y
) {
isGameOver = true;
playSound('hit');
if (score > highScore) highScore = score;
}
}
// Drop items passing left boundaries safely
if (obstacles[i].x < -60) {
obstacles.splice(i, 1);
}
}
dino.update();
dino.draw();
// UI Canvas Metrics Board Layout
ctx.fillStyle = nightMode ? "#e8eaed" : "#535353";
ctx.font = "12px 'Courier New'";
let cleanScore = String(score).padStart(5, '0');
let cleanHighScore = String(highScore).padStart(5, '0');
let badge = godModeCheck.checked ? "GOD " : "";
if (autoJumpCheck.checked) badge += "AUTO ";
ctx.fillText(${badge}HI ${cleanHighScore} ${cleanScore}, 430, 25);
requestAnimationFrame(loop);
if (isGameOver) {
ctx.fillStyle = nightMode ? "#e8eaed" : "#535353";
ctx.font = "bold 16px 'Courier New'";
ctx.fillText("G A M E  O V E R", 220, 65);
ctx.font = "24px sans-serif";
ctx.fillText("↻", 288, 95);
}
}
// Render Initial Start Layout
ctx.fillStyle = "#535353";
ctx.font = "14px 'Courier New'";
ctx.fillText("Press SPACEBAR to Start Game", 180, 75);
dino.draw();
