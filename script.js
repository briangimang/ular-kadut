// ============================================================
// SNAKE HD
// JavaScript / HTML5 Canvas Version
// ============================================================


// ============================================================
// CANVAS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = 1280;
const HEIGHT = 720;

const GRID_SIZE = 32;

const COLS = WIDTH / GRID_SIZE;
const ROWS = HEIGHT / GRID_SIZE;


// ============================================================
// COLORS
// ============================================================

const BG_TOP = "#070b16";
const BG_BOTTOM = "#0c1422";
const GRID_COLOR = "#141d2e";

const SNAKE_HEAD_COLOR = "#5affaf";
const SNAKE_BODY_COLOR = "#23d287";

const FOOD_COLOR = "#ff4669";
const FOOD_LIGHT = "#ffb4c8";

const WHITE = "#f0f7ff";
const GRAY = "#8291aa";


// ============================================================
// GAME STATE
// ============================================================

let state = "menu";

let score = 0;
let highScore = 0;

let paused = false;
let gameOver = false;

let lastTime = 0;

let animationTime = 0;


// ============================================================
// DOM
// ============================================================

const mainMenu =
    document.getElementById("mainMenu");

const gameUI =
    document.getElementById("gameUI");

const pauseScreen =
    document.getElementById("pauseScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const scoreElement =
    document.getElementById("score");

const highScoreElement =
    document.getElementById("highScore");

const menuHighScoreElement =
    document.getElementById("menuHighScore");

const gameOverScoreElement =
    document.getElementById("finalScore");

const gameOverHighScoreElement =
    document.getElementById("finalHighScore");


// ============================================================
// RESIZE
// ============================================================

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        WIDTH * dpr;

    canvas.height =
        HEIGHT * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


// ============================================================
// HELPERS
// ============================================================

function clamp(
    value,
    min,
    max
) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function lerp(
    a,
    b,
    t
) {
    return a + (b - a) * t;
}


function randomInt(
    min,
    max
) {
    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


function distance(
    x1,
    y1,
    x2,
    y2
) {
    return Math.sqrt(
        (x2 - x1) ** 2 +
        (y2 - y1) ** 2
    );
}


// ============================================================
// GLOW
// ============================================================

function drawGlow(
    x,
    y,
    color,
    radius,
    alpha = 0.5
) {

    const gradient =
        ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            radius
        );

    function toRgba(hex, a) {
        const value = hex.replace("#", "");
        const r = parseInt(value.substring(0, 2), 16);
        const g = parseInt(value.substring(2, 4), 16);
        const b = parseInt(value.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    gradient.addColorStop(0, toRgba(color, alpha));
    gradient.addColorStop(1, toRgba(color, 0));

    ctx.save();

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


// ============================================================
// PARTICLE
// ============================================================

class Particle {

    constructor(
        x,
        y,
        color
    ) {

        this.x = x;
        this.y = y;

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            70 +
            Math.random() * 160;

        this.vx =
            Math.cos(angle) *
            speed;

        this.vy =
            Math.sin(angle) *
            speed;

        this.life =
            0.3 +
            Math.random() *
            0.4;

        this.maxLife =
            this.life;

        this.size =
            2 +
            Math.random() * 3;

        this.color = color;
    }


    update(dt) {

        this.x +=
            this.vx * dt;

        this.y +=
            this.vy * dt;

        this.vx *= 0.95;
        this.vy *= 0.95;

        this.life -= dt;
    }


    draw() {

        if (this.life <= 0) {
            return;
        }

        const alpha =
            this.life /
            this.maxLife;

        ctx.save();

        ctx.globalAlpha = alpha;

        ctx.fillStyle =
            this.color;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}


// ============================================================
// FOOD
// ============================================================

class Food {

    constructor() {

        this.position = {
            x: randomInt(2, COLS - 3),
            y: randomInt(2, ROWS - 3)
        };

        this.animation = 0;
    }


    respawn(snake) {

        let attempts = 0;

        while (attempts < 1000) {

            const position = {
                x: randomInt(2, COLS - 3),
                y: randomInt(2, ROWS - 3)
            };

            const occupied =
                snake.body.some(
                    segment =>
                        segment.x === position.x &&
                        segment.y === position.y
                );

            if (!occupied) {

                this.position =
                    position;

                return;
            }

            attempts++;
        }
    }


    update(dt) {

        this.animation +=
            dt * 5;
    }


    draw() {

        const x =
            this.position.x *
            GRID_SIZE +
            GRID_SIZE / 2;

        const y =
            this.position.y *
            GRID_SIZE +
            GRID_SIZE / 2;

        const pulse =
            (
                Math.sin(
                    this.animation
                ) + 1
            ) / 2;

        const radius =
            9 +
            pulse * 3;

        // Glow
        ctx.save();

        ctx.shadowBlur = 30;

        ctx.shadowColor =
            FOOD_COLOR;

        ctx.fillStyle =
            FOOD_COLOR;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();


        // Highlight
        ctx.fillStyle =
            FOOD_LIGHT;

        ctx.beginPath();

        ctx.arc(
            x - 3,
            y - 3,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// ============================================================
// SNAKE
// ============================================================

class Snake {

    constructor() {

        this.reset();
    }


    reset() {

        const centerX =
            Math.floor(COLS / 2);

        const centerY =
            Math.floor(ROWS / 2);

        this.body = [
            {
                x: centerX,
                y: centerY
            },
            {
                x: centerX - 1,
                y: centerY
            },
            {
                x: centerX - 2,
                y: centerY
            },
            {
                x: centerX - 3,
                y: centerY
            },
            {
                x: centerX - 4,
                y: centerY
            }
        ];


        this.direction = {
            x: 1,
            y: 0
        };


        this.nextDirection = {
            x: 1,
            y: 0
        };


        this.moveTimer = 0;

        this.moveInterval =
            0.085;

        this.growing = false;


        this.visualPositions =
            this.body.map(
                segment => ({
                    x:
                        segment.x *
                        GRID_SIZE +
                        GRID_SIZE / 2,

                    y:
                        segment.y *
                        GRID_SIZE +
                        GRID_SIZE / 2
                })
            );
    }


    changeDirection(direction) {

        if (
            direction.x ===
                -this.direction.x &&
            direction.y ===
                -this.direction.y
        ) {
            return;
        }

        this.nextDirection = {
            x: direction.x,
            y: direction.y
        };
    }


    grow() {

        this.growing = true;
    }


    update(dt) {

        this.moveTimer += dt;

        let moved = false;


        while (
            this.moveTimer >=
            this.moveInterval
        ) {

            this.moveTimer -=
                this.moveInterval;


            this.direction = {
                x:
                    this.nextDirection.x,

                y:
                    this.nextDirection.y
            };


            const head =
                this.body[0];


            const newHead = {
                x:
                    head.x +
                    this.direction.x,

                y:
                    head.y +
                    this.direction.y
            };


            this.body.unshift(
                newHead
            );


            if (!this.growing) {

                this.body.pop();
            }


            this.growing = false;

            moved = true;
        }


        // Smooth interpolation
        const targets =
            this.body.map(
                segment => ({
                    x:
                        segment.x *
                        GRID_SIZE +
                        GRID_SIZE / 2,

                    y:
                        segment.y *
                        GRID_SIZE +
                        GRID_SIZE / 2
                })
            );


        while (
            this.visualPositions.length <
            targets.length
        ) {

            this.visualPositions.push({
                x: targets[
                    targets.length - 1
                ].x,

                y: targets[
                    targets.length - 1
                ].y
            });
        }


        if (
            this.visualPositions.length >
            targets.length
        ) {

            this.visualPositions =
                this.visualPositions.slice(
                    0,
                    targets.length
                );
        }


        const smooth =
            clamp(
                dt * 20,
                0,
                1
            );


        for (
            let i = 0;
            i < targets.length;
            i++
        ) {

            this.visualPositions[i].x =
                lerp(
                    this.visualPositions[i].x,
                    targets[i].x,
                    smooth
                );


            this.visualPositions[i].y =
                lerp(
                    this.visualPositions[i].y,
                    targets[i].y,
                    smooth
                );
        }


        return moved;
    }


    checkCollision() {

        const head =
            this.body[0];


        // Wall
        if (
            head.x < 0 ||
            head.x >= COLS ||
            head.y < 0 ||
            head.y >= ROWS
        ) {

            return true;
        }


        // Self
        for (
            let i = 1;
            i < this.body.length;
            i++
        ) {

            if (
                this.body[i].x === head.x &&
                this.body[i].y === head.y
            ) {

                return true;
            }
        }


        return false;
    }


    draw() {

        if (
            this.visualPositions.length === 0
        ) {
            return;
        }


        const points =
            this.visualPositions;


        // ====================================================
        // BODY GLOW
        // ====================================================

        if (points.length >= 2) {

            ctx.save();

            ctx.strokeStyle =
                "rgba(35, 210, 135, 0.18)";

            ctx.lineWidth = 35;

            ctx.lineCap = "round";

            ctx.lineJoin = "round";

            ctx.beginPath();

            ctx.moveTo(
                points[0].x,
                points[0].y
            );

            for (
                let i = 1;
                i < points.length;
                i++
            ) {

                ctx.lineTo(
                    points[i].x,
                    points[i].y
                );
            }

            ctx.stroke();

            ctx.restore();
        }


        // ====================================================
        // BODY MAIN
        // ====================================================

        if (points.length >= 2) {

            ctx.save();

            ctx.strokeStyle =
                SNAKE_BODY_COLOR;

            ctx.lineWidth = 22;

            ctx.lineCap = "round";

            ctx.lineJoin = "round";

            ctx.beginPath();

            ctx.moveTo(
                points[0].x,
                points[0].y
            );

            for (
                let i = 1;
                i < points.length;
                i++
            ) {

                ctx.lineTo(
                    points[i].x,
                    points[i].y
                );
            }

            ctx.stroke();

            ctx.restore();
        }


        // ====================================================
        // SEGMENTS
        // ====================================================

        const total =
            points.length;


        for (
            let i = total - 1;
            i >= 0;
            i--
        ) {

            const point =
                points[i];


            const progress =
                i /
                Math.max(
                    1,
                    total - 1
                );


            let radius;


            if (i === 0) {

                radius = 14;

            } else {

                radius =
                    Math.max(
                        5,
                        11 -
                        progress * 6
                    );
            }


            const r =
                Math.floor(
                    50 -
                    progress * 15
                );

            const g =
                Math.floor(
                    230 -
                    progress * 50
                );

            const b =
                Math.floor(
                    135 -
                    progress * 30
                );


            ctx.fillStyle =
                `rgb(${r}, ${g}, ${b})`;


            ctx.beginPath();

            ctx.arc(
                point.x,
                point.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        // ====================================================
        // BODY HIGHLIGHT
        // ====================================================

        if (points.length >= 2) {

            ctx.save();

            ctx.strokeStyle =
                "#6effc2";

            ctx.lineWidth = 3;

            ctx.lineCap = "round";

            ctx.globalAlpha = 0.8;

            ctx.beginPath();

            const max =
                Math.min(
                    15,
                    points.length
                );


            ctx.moveTo(
                points[0].x - 3,
                points[0].y - 4
            );


            for (
                let i = 1;
                i < max;
                i++
            ) {

                ctx.lineTo(
                    points[i].x - 3,
                    points[i].y - 4
                );
            }


            ctx.stroke();

            ctx.restore();
        }


        // ====================================================
        // HEAD
        // ====================================================

        const head =
            points[0];


        const dx =
            this.direction.x;

        const dy =
            this.direction.y;


        const px = -dy;
        const py = dx;


        const headLength = 28;
        const headWidth = 20;


        const tip = {
            x:
                head.x +
                dx *
                headLength,

            y:
                head.y +
                dy *
                headLength
        };


        const back = {
            x:
                head.x -
                dx * 8,

            y:
                head.y -
                dy * 8
        };


        const left = {
            x:
                back.x +
                px *
                headWidth,

            y:
                back.y +
                py *
                headWidth
        };


        const right = {
            x:
                back.x -
                px *
                headWidth,

            y:
                back.y -
                py *
                headWidth
        };


        // Head glow
        ctx.save();

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            SNAKE_HEAD_COLOR;

        ctx.fillStyle =
            SNAKE_HEAD_COLOR;


        ctx.beginPath();

        ctx.moveTo(
            tip.x,
            tip.y
        );

        ctx.lineTo(
            left.x,
            left.y
        );

        ctx.lineTo(
            right.x,
            right.y
        );

        ctx.closePath();

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            head.x,
            head.y,
            17,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();


        // ====================================================
        // EYES
        // ====================================================

        const eyeDistance = 8;


        const eyeCenter = {
            x:
                head.x +
                dx * 8,

            y:
                head.y +
                dy * 8
        };


        const eye1 = {
            x:
                eyeCenter.x +
                px *
                eyeDistance,

            y:
                eyeCenter.y +
                py *
                eyeDistance
        };


        const eye2 = {
            x:
                eyeCenter.x -
                px *
                eyeDistance,

            y:
                eyeCenter.y -
                py *
                eyeDistance
        };


        ctx.fillStyle =
            WHITE;


        ctx.beginPath();

        ctx.arc(
            eye1.x,
            eye1.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            eye2.x,
            eye2.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // Pupils
        ctx.fillStyle =
            "#050f12";


        ctx.beginPath();

        ctx.arc(
            eye1.x + dx * 2,
            eye1.y + dy * 2,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            eye2.x + dx * 2,
            eye2.y + dy * 2,
            2,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // ====================================================
        // TONGUE
        // ====================================================

        const tongueStart = {
            x:
                head.x +
                dx * 22,

            y:
                head.y +
                dy * 22
        };


        const tongueEnd = {
            x:
                tongueStart.x +
                dx * 13,

            y:
                tongueStart.y +
                dy * 13
        };


        ctx.save();

        ctx.strokeStyle =
            "#ff5a78";

        ctx.lineWidth = 2;

        ctx.lineCap = "round";


        ctx.beginPath();

        ctx.moveTo(
            tongueStart.x,
            tongueStart.y
        );

        ctx.lineTo(
            tongueEnd.x,
            tongueEnd.y
        );

        ctx.stroke();


        // Fork
        ctx.beginPath();

        ctx.moveTo(
            tongueEnd.x,
            tongueEnd.y
        );

        ctx.lineTo(
            tongueEnd.x +
            dx * 5 +
            px * 3,

            tongueEnd.y +
            dy * 5 +
            py * 3
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            tongueEnd.x,
            tongueEnd.y
        );

        ctx.lineTo(
            tongueEnd.x +
            dx * 5 -
            px * 3,

            tongueEnd.y +
            dy * 5 -
            py * 3
        );

        ctx.stroke();


        ctx.restore();
    }
}


// ============================================================
// GAME OBJECTS
// ============================================================

let snake =
    new Snake();

let food =
    new Food();

let particles = [];


// ============================================================
// BACKGROUND
// ============================================================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );


    gradient.addColorStop(
        0,
        BG_TOP
    );


    gradient.addColorStop(
        1,
        BG_BOTTOM
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    // Grid
    ctx.strokeStyle =
        GRID_COLOR;

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < WIDTH;
        x += GRID_SIZE
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            HEIGHT
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < HEIGHT;
        y += GRID_SIZE
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(
            WIDTH,
            y
        );

        ctx.stroke();
    }
}


// ============================================================
// PARTICLES
// ============================================================

function createFoodParticles() {

    const x =
        food.position.x *
        GRID_SIZE +
        GRID_SIZE / 2;

    const y =
        food.position.y *
        GRID_SIZE +
        GRID_SIZE / 2;


    for (
        let i = 0;
        i < 30;
        i++
    ) {

        particles.push(
            new Particle(
                x,
                y,
                FOOD_COLOR
            )
        );
    }
}


function updateParticles(dt) {

    for (
        const particle of particles
    ) {

        particle.update(dt);
    }


    particles =
        particles.filter(
            particle =>
                particle.life > 0
        );
}


function drawParticles() {

    for (
        const particle of particles
    ) {

        particle.draw();
    }
}


// ============================================================
// SCORE
// ============================================================

function updateScoreUI() {

    scoreElement.textContent =
        score;

    highScoreElement.textContent =
        highScore;

    menuHighScoreElement.textContent =
        highScore;

    gameOverScoreElement.textContent =
        score;

    gameOverHighScoreElement.textContent =
        highScore;
}


// ============================================================
// HIGH SCORE - LOCAL STORAGE
// ============================================================

function loadHighScore() {
    try {
        highScore = Number(localStorage.getItem("snakeHDHighScore")) || 0;
    } catch (error) {
        highScore = 0;
    }
    updateScoreUI();
}

function saveHighScore() {
    try {
        localStorage.setItem("snakeHDHighScore", String(highScore));
    } catch (error) {
        console.warn("High score tidak bisa disimpan:", error);
    }
    updateScoreUI();
}


// RESET GAME
// ============================================================

function resetGame() {

    snake.reset();

    food.respawn(
        snake
    );

    score = 0;

    gameOver = false;

    paused = false;

    particles = [];

    updateScoreUI();

    hideScreen(
        pauseScreen
    );

    hideScreen(
        gameOverScreen
    );
}


// ============================================================
// START GAME
// ============================================================

function startGame() {

    resetGame();

    state = "game";

    showScreen(
        gameUI
    );

    hideScreen(
        mainMenu
    );
}


// ============================================================
// MAIN MENU
// ============================================================

function showMenu() {

    state = "menu";

    paused = false;

    gameOver = false;

    showScreen(
        mainMenu
    );

    hideScreen(
        gameUI
    );

    hideScreen(
        pauseScreen
    );

    hideScreen(
        gameOverScreen
    );

    updateScoreUI();
}


// ============================================================
// UI HELPERS
// ============================================================

function showScreen(element) {

    element.classList.remove(
        "hidden"
    );
}


function hideScreen(element) {

    element.classList.add(
        "hidden"
    );
}


// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (
        state !== "game" ||
        gameOver
    ) {
        return;
    }


    paused =
        !paused;


    if (paused) {

        showScreen(
            pauseScreen
        );

    } else {

        hideScreen(
            pauseScreen
        );
    }
}


// ============================================================
// GAME OVER
// ============================================================

function triggerGameOver() {

    gameOver = true;

    updateScoreUI();

    showScreen(
        gameOverScreen
    );

    saveHighScore();
}


// ============================================================
// MOVEMENT
// ============================================================

function moveUp() {

    if (
        !gameOver &&
        !paused &&
        state === "game"
    ) {

        snake.changeDirection({
            x: 0,
            y: -1
        });
    }
}


function moveDown() {

    if (
        !gameOver &&
        !paused &&
        state === "game"
    ) {

        snake.changeDirection({
            x: 0,
            y: 1
        });
    }
}


function moveLeft() {

    if (
        !gameOver &&
        !paused &&
        state === "game"
    ) {

        snake.changeDirection({
            x: -1,
            y: 0
        });
    }
}


function moveRight() {

    if (
        !gameOver &&
        !paused &&
        state === "game"
    ) {

        snake.changeDirection({
            x: 1,
            y: 0
        });
    }
}


// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        // ================================================
        // MENU
        // ================================================

        if (state === "menu") {

            if (
                key === "enter" ||
                key === " "
            ) {

                startGame();

                return;
            }


            if (key === "escape") {

                return;
            }


            return;
        }


        // ================================================
        // GAME OVER
        // ================================================

        if (gameOver) {

            if (key === "enter") {

                resetGame();

                return;
            }


            if (key === "escape") {

                showMenu();

                return;
            }


            return;
        }


        // ================================================
        // PAUSE
        // ================================================

        if (key === " ") {

            event.preventDefault();

            togglePause();

            return;
        }


        // ================================================
        // MAIN MENU
        // ================================================

        if (key === "escape") {

            showMenu();

            return;
        }


        // ================================================
        // MOVEMENT
        // ================================================

        if (
            key === "arrowup" ||
            key === "w"
        ) {

            moveUp();

        } else if (
            key === "arrowdown" ||
            key === "s"
        ) {

            moveDown();

        } else if (
            key === "arrowleft" ||
            key === "a"
        ) {

            moveLeft();

        } else if (
            key === "arrowright" ||
            key === "d"
        ) {

            moveRight();
        }
    }
);


// ============================================================
// BUTTON CONTROLS
// ============================================================

const directionButtons =
    document.querySelectorAll(
        ".direction-button"
    );


directionButtons.forEach(
    button => {

        button.addEventListener(
            "pointerdown",
            event => {

                event.preventDefault();

                const direction =
                    button.dataset.direction;


                if (
                    direction === "up"
                ) {

                    moveUp();

                } else if (
                    direction === "down"
                ) {

                    moveDown();

                } else if (
                    direction === "left"
                ) {

                    moveLeft();

                } else if (
                    direction === "right"
                ) {

                    moveRight();
                }
            }
        );
    }
);


// ============================================================
// MENU BUTTONS
// ============================================================

document
    .getElementById("playButton")
    .addEventListener(
        "click",
        () => {

            startGame();
        }
    );


document
    .getElementById("quitButton")
    .addEventListener(
        "click",
        () => {

            /*
             * Browser tidak mengizinkan halaman biasa
             * menutup tab sendiri dalam banyak kondisi.
             *
             * Jadi kita kembali ke menu.
             */

            showMenu();
        }
    );


// ============================================================
// GAME UPDATE
// ============================================================

function updateGame(dt) {

    updateParticles(dt);


    if (
        gameOver ||
        paused
    ) {

        return;
    }


    food.update(dt);


    const moved =
        snake.update(dt);


    if (!moved) {

        return;
    }


    // ================================================
    // EAT FOOD
    // ================================================

    const head =
        snake.body[0];


    if (
        head.x === food.position.x &&
        head.y === food.position.y
    ) {

        createFoodParticles();

        snake.grow();

        score += 10;


        // High score
        if (
            score > highScore
        ) {

            highScore =
                score;

            saveHighScore();
        }


        // Speed
        snake.moveInterval =
            Math.max(
                0.035,
                0.085 -
                score * 0.00035
            );


        food.respawn(
            snake
        );


        updateScoreUI();
    }


    // ================================================
    // COLLISION
    // ================================================

    if (
        snake.checkCollision()
    ) {

        triggerGameOver();
    }
}


// ============================================================
// DRAW
// ============================================================

function drawGame() {

    drawBackground();

    food.draw();

    snake.draw();

    drawParticles();
}


// ============================================================
// MENU CANVAS EFFECT
// ============================================================

function drawMenuBackground() {

    drawBackground();


    const pulse =
        (
            Math.sin(
                animationTime * 2
            ) + 1
        ) / 2;


    const gradient =
        ctx.createRadialGradient(
            WIDTH / 2,
            160,
            0,
            WIDTH / 2,
            160,
            180 +
            pulse * 25
        );


    gradient.addColorStop(
        0,
        "rgba(90, 255, 175, 0.12)"
    );


    gradient.addColorStop(
        1,
        "rgba(90, 255, 175, 0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        WIDTH / 2 - 220,
        0,
        440,
        350
    );
}


// ============================================================
// MAIN LOOP
// ============================================================

function gameLoop(timestamp) {

    if (!lastTime) {

        lastTime =
            timestamp;
    }


    let dt =
        (timestamp - lastTime) /
        1000;


    lastTime =
        timestamp;


    // Prevent huge dt after tab switching
    dt =
        Math.min(
            dt,
            0.1
        );


    animationTime += dt;


    // ================================================
    // UPDATE
    // ================================================

    if (state === "game") {

        updateGame(dt);
    }


    // ================================================
    // DRAW
    // ================================================

    if (state === "menu") {

        drawMenuBackground();

    } else {

        drawGame();
    }


    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// INITIALIZE
// ============================================================

loadHighScore();

updateScoreUI();

showMenu();

requestAnimationFrame(
    gameLoop
);