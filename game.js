const canvas = document.getElementById("mycanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Изображения
const background = new Image();
background.src = "img/background.png";

const ballImage = new Image();
const newLocal = ballImage.src = "img/ball.png";

const platformImage = new Image();
platformImage.src = "img/platform.png";

const blockImage = new Image();
blockImage.src = "img/block.png";

// Звук столкновения
const bumpSound = new Audio("sounds/bump.mp3");
bumpSound.volume = 0.35;

function playBump() {
    bumpSound.currentTime = 0;
    bumpSound.play().catch(() => {});
}

// Платформа
const platform = {
    x: (W - 100) / 2,
    y: H - 35,
    width: 100,
    height: 14,
    speed: 6
};

// Мяч
const ball = {
    x: W / 2 - 10,
    y: platform.y - 20,
    width: 20,
    height: 20,
    vx: 0,
    vy: 0,
    speed: 4,
    launched: false
};

// Управление
const keys = {
    left: false,
    right: false
};

// Состояние игры
let gameOver = false;
let won = false;
let score = 0;

// Создаём блоки
const blocks = [];
const rows = 4;
const cols = 10;
const blockWidth = 60;
const blockHeight = 20;
const gap = 2;
const startX = (W - cols * (blockWidth + gap) + gap) / 2;
const startY = 35;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        blocks.push({
            x: startX + col * (blockWidth + gap),
            y: startY + row * (blockHeight + gap),
            width: blockWidth,
            height: blockHeight,
            alive: true
        });
    }
}

// Управление клавиатурой
document.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (event.code === "ArrowLeft" || event.code === "KeyA") {
        keys.left = true;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
        keys.right = true;
    }

    if (event.code === "Space" && !ball.launched &&
        !gameOver && !won) {
        launchBall();
    }

    if (event.code === "KeyR" && (gameOver || won)) {
        restartGame();
    }
});

document.addEventListener("keyup", (event) => {
    if (event.code === "ArrowLeft" || event.code === "KeyA") {
        keys.left = false;
    }

    if (event.code === "ArrowRight" || event.code === "KeyD") {
        keys.right = false;
    }
});

// Запускаем мяч под случайным углом
function launchBall() {
    const angle = (Math.random() * 60 + 60) * Math.PI / 180;
    const direction = Math.random() < 0.5 ? -1 : 1;

    ball.vx = Math.cos(angle) * ball.speed * direction;
    ball.vy = -Math.sin(angle) * ball.speed;
    ball.launched = true;
}

// Перезапуск игры
function restartGame() {
    platform.x = (W - platform.width) / 2;
    ball.x = W / 2 - ball.width / 2;
    ball.y = platform.y - ball.height;
    ball.vx = 0;
    ball.vy = 0;
    ball.launched = false;

    blocks.forEach(block => block.alive = true);

    score = 0;
    gameOver = false;
    won = false;
}

// Движение платформы
function movePlatform() {
    if (keys.left) platform.x -= platform.speed;
    if (keys.right) platform.x += platform.speed;

    // Платформа не выходит за края поля
    platform.x = Math.max(
        0,
        Math.min(W - platform.width, platform.x)
    );
}

// Проверка пересечения двух прямоугольников
function overlaps(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Обновление положения мяча
function updateBall() {
    if (!ball.launched) {
        ball.x = platform.x + platform.width / 2 -
                 ball.width / 2;
        ball.y = platform.y - ball.height;
        return;
    }

    const oldX = ball.x;
    const oldY = ball.y;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Отскок от левой и правой стен
    if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
        playBump();
    } else if (ball.x + ball.width >= W) {
        ball.x = W - ball.width;
        ball.vx = -Math.abs(ball.vx);
        playBump();
    }

    // Отскок от верхней стены
    if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        playBump();
    }

    // Столкновение с платформой
    if (
        ball.vy > 0 &&
        oldY + ball.height <= platform.y &&
        overlaps(ball, platform)
    ) {
        ball.y = platform.y - ball.height;

        // Угол отскока зависит от места попадания
        const hit = (
            (ball.x + ball.width / 2) -
            (platform.x + platform.width / 2)
        ) / (platform.width / 2);

        const angle = hit * Math.PI / 3;

        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle);

        playBump();
    }

    // Столкновение с блоками
    for (const block of blocks) {
        if (!block.alive || !overlaps(ball, block)) continue;

        block.alive = false;
        score++;

        // Определяем сторону столкновения
        const fromLeft = oldX + ball.width <= block.x;
        const fromRight = oldX >= block.x + block.width;
        const fromTop = oldY + ball.height <= block.y;
        const fromBottom = oldY >= block.y + block.height;

        if (fromLeft || fromRight) {
            ball.vx *= -1;
        } else if (fromTop || fromBottom) {
            ball.vy *= -1;
        } else {
            ball.vy *= -1;
        }

        playBump();
        break;
    }

    // Проигрыш: мяч упал ниже поля
    if (ball.y > H) {
        gameOver = true;
    }

    // Победа: все блоки уничтожены
    if (blocks.every(block => !block.alive)) {
        won = true;
    }
}

// Отрисовка игрового поля
function drawGame() {
    ctx.clearRect(0, 0, W, H);

    if (background.complete && background.naturalWidth) {
        ctx.drawImage(background, 0, 0, W, H);
    } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, W, H);
    }

    // Блоки: используем первый кадр спрайта
    if (blockImage.complete && blockImage.naturalWidth >= 20) {
        for (const block of blocks) {
            if (!block.alive) continue;

            ctx.drawImage(
                blockImage,
                0, 0, 20, 20,
                block.x, block.y,
                block.width, block.height
            );
        }
    }

    // Платформа
    if (platformImage.complete && platformImage.naturalWidth) {
        ctx.drawImage(
            platformImage,
            platform.x, platform.y,
            platform.width, platform.height
        );
    }

    // Мяч
    if (ballImage.complete && ballImage.naturalWidth >= 20) {
        ctx.drawImage(
            ballImage,
            0, 0, 20, 20,
            ball.x, ball.y,
            ball.width, ball.height
        );
    }

    // Счёт
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("Счёт: " + score, 10, H - 10);

    // Подсказка перед запуском
    if (!ball.launched && !gameOver && !won) {
        ctx.textAlign = "center";
        ctx.fillText("Нажми ПРОБЕЛ, чтобы начать", W / 2, H - 55);
        ctx.textAlign = "left";
    }

    // Сообщение о проигрыше или победе
    if (gameOver || won) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "32px Arial";
        ctx.fillText(
            won ? "Ты победил!" : "Игра окончена!",
            W / 2,
            H / 2
        );

        ctx.font = "18px Arial";
        ctx.fillText(
            "Нажми R, чтобы начать заново",
            W / 2,
            H / 2 + 35
        );
        ctx.textAlign = "left";
    }
}

// Main game loop
function gameLoop() {
    if (!gameOver && !won) {
        movePlatform();
        updateBall();
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

gameLoop();

