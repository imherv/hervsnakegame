const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileCountX, tileCountY, gridSize;

function resizeGame() {
    const containerWidth = canvas.parentElement.clientWidth - 20; // Subtrai margem para evitar cortes
    const containerHeight = canvas.parentElement.clientHeight - 20; // Subtrai margem para evitar cortes
    const size = Math.min(containerWidth, containerHeight, 380); // Ajusta o tamanho máximo para 380x380

    gridSize = Math.floor(size / 20); // tamanho dinâmico do grid
    canvas.width = canvas.height = size;

    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);

    initGame();
}

let snake = [];
let food = {};
let direction = {};
let newDirection = {};
let gameOver = false;
let isPaused = false; // Adiciona uma variável para controlar o estado de pausa
let speed = 250;
let intervalId;
let score = 0;
let highScore = 0;

function initGame() {
    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }
    ];
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    direction = { x: 1, y: 0 };
    newDirection = { x: 1, y: 0 };
    gameOver = false;
    isPaused = false; // Reinicia o estado de pausa
    score = 0;
    speed = 250;

    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(gameLoop, speed);

    updateScore();
}

function changeDirection(event) {
    switch (event.keyCode) {
        case 37: // Esquerda
        case 65: // A
            if (direction.x === 0) newDirection = { x: -1, y: 0 };
            break;
        case 38: // Cima
        case 87: // W
            if (direction.y === 0) newDirection = { x: 0, y: -1 };
            break;
        case 39: // Direita
        case 68: // D
            if (direction.x === 0) newDirection = { x: 1, y: 0 };
            break;
        case 40: // Baixo
        case 83: // S
            if (direction.y === 0) newDirection = { x: 0, y: 1 };
            break;
        case 82: // R
            if (gameOver) {
                initGame(); // Reinicia o jogo mantendo o high score
            }
            break;
        case 32: // Espaço
            if (!gameOver) {
                isPaused = !isPaused; // Alterna o estado de pausa
            }
            break;
    }
}

function gameLoop() {
    if (gameOver) {
        if (confirm("Game Over! Deseja reiniciar?")) {
            initGame(); // Reinicia o jogo mantendo o high score
        }
        return;
    }

    if (isPaused) {
        return; // Se o jogo estiver pausado, não faz nada
    }

    direction = newDirection; // Atualiza a direção com a nova direção

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
        }
        updateScore();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        food = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };

        score++;
        updateScore();

        if (score % 10 === 0 && speed > 50) {
            speed -= 20;
            clearInterval(intervalId);
            intervalId = setInterval(gameLoop, speed);
        }
    } else {
        snake.pop();
    }

    ctx.fillStyle = "#500087"; // Cor do fundo
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFFFFF"; // Cor da cobra
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    ctx.fillStyle = "#FFFCE7"; // Cor da comida
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function updateScore() {
    document.getElementById("score").innerText = `Pontos: ${score}`;
    document.getElementById("highScore").innerText = `Pontuação mais alta: ${highScore}`;
}

window.addEventListener("resize", resizeGame);
document.addEventListener("keydown", changeDirection);

resizeGame();
