const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const startMsg = document.getElementById('start-msg');

// Game constants
const gridSize = 20;
const tileCount = 20;
canvas.width = gridSize * tileCount;
canvas.height = gridSize * tileCount;

// Game variables
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let speed = 150; // Initial speed in ms
let lastRenderTime = 0;
let gameRunning = false;
let gameOver = false;

// Particle system
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = color;
        this.opacity = 1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.02;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x + gridSize / 2, y + gridSize / 2, color));
    }
}

function handleInput(e) {
    if (gameOver) return;

    if (!gameRunning) {
        gameRunning = true;
        startMsg.classList.add('hidden');
        dx = 1; dy = 0; // Default start direction: Right
        nextDx = 1; nextDy = 0;
        requestAnimationFrame(gameLoop);
    }

    const key = e.key.toLowerCase();
    
    if ((key === 'arrowup' || key === 'w') && dy === 0) {
        nextDx = 0; nextDy = -1;
    } else if ((key === 'arrowdown' || key === 's') && dy === 0) {
        nextDx = 0; nextDy = 1;
    } else if ((key === 'arrowleft' || key === 'a') && dx === 0) {
        nextDx = -1; nextDy = 0;
    } else if ((key === 'arrowright' || key === 'd') && dx === 0) {
        nextDx = 1; nextDy = 0;
    }
}

function update() {
    // Apply input buffer
    dx = nextDx;
    dy = nextDy;

    // Move snake head
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check collision: Wall
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    // Check collision: Self
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        createParticles(food.x * gridSize, food.y * gridSize, '#39ff14');
        spawnFood();
        // Speed up
        speed = Math.max(50, 150 - Math.floor(score / 50) * 5);
    } else {
        snake.pop();
    }
}

function spawnFood() {
    while (true) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Ensure food doesn't spawn on snake
        if (!snake.some(segment => segment.x === food.x && segment.y === food.y)) break;
    }
}

function draw() {
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(5, 5, 5, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#39ff14' : '#00d2ff';
        ctx.shadowBlur = isHead ? 15 : 5;
        ctx.shadowColor = ctx.fillStyle;
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    });

    // Draw food
    ctx.fillStyle = '#ff2d75';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff2d75';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw particles
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.opacity <= 0) particles.splice(i, 1);
    });
}

function endGame() {
    gameOver = true;
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverOverlay.classList.remove('hidden');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

function restart() {
    score = 0;
    scoreElement.textContent = '0';
    snake = [{ x: 10, y: 10 }];
    dx = 1; dy = 0;
    nextDx = 1; nextDy = 0;
    speed = 150;
    gameOver = false;
    gameRunning = true;
    gameOverOverlay.classList.add('hidden');
    spawnFood();
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    requestAnimationFrame(gameLoop);
    const secondsSinceLastRender = (currentTime - lastRenderTime);
    if (secondsSinceLastRender < speed) return;
    
    lastRenderTime = currentTime;
    update();
    draw();
}

// Initial draw
spawnFood();
draw();

// Event listeners
window.addEventListener('keydown', handleInput);
restartBtn.addEventListener('click', restart);
