const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileCountX, tileCountY, gridSize;

function resizeGame() {
    const containerWidth = canvas.parentElement.clientWidth - 20;
    const containerHeight = canvas.parentElement.clientHeight - 20;
    const size = Math.min(containerWidth, containerHeight, 380); // Ajuste do tamanho máximo

    gridSize = Math.floor(size / 20); // Tamanho dinâmico do grid
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
let speed = 250; // Velocidade padrão, inicial e máxima
let intervalId;
let score = 0;
let highScore = 0;
let paused = false;

function initGame() {
    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }
    ];
    food = generateFood();
    direction = { x: 1, y: 0 };
    newDirection = { x: 1, y: 0 };
    gameOver = false;
    paused = false;
    score = 0;
    updateSpeed();
    updateScore();

    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(gameLoop, speed);
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
        case 32: // Espaço para pausar
            togglePause();
            break;
        case 82: // R para reiniciar em qualquer momento
            initGame();
            break;
    }
}

function gameLoop() {
    if (gameOver) {
        clearInterval(intervalId);
        if (score >= 300) {
            setTimeout(() => {
                alert(`Você ganhou com ${score} pontos!`);
                initGame(); // Reinicia o jogo após a mensagem de vitória
            }, 10);
        } else {
            setTimeout(() => {
                alert(`Você colidiu... Tente novamente!`);
                initGame(); // Reinicia o jogo após a mensagem de game over
            }, 10);
        }
        return;
    }

    if (paused) return;

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
        food = generateFood();
        score++;
        updateScore();
        updateSpeed();
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
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function updateScore() {
    document.getElementById("score").innerText = `Atual: ${score}`;
    document.getElementById("highScore").innerText = `Maior: ${highScore}`;
}

function updateSpeed() {
    let newSpeed = 250;
    if (score >= 300) newSpeed = 100;
    else if (score >= 250) newSpeed = 100;
    else if (score >= 100) newSpeed = 125;
    else if (score >= 75) newSpeed = 150;
    else if (score >= 50) newSpeed = 175;
    else if (score >= 25) newSpeed = 200;
    else if (score >= 10) newSpeed = 225;

    if (newSpeed < 50) newSpeed = 50; // Mantém a velocidade mínima de 50ms

    if (speed !== newSpeed) {
        speed = newSpeed;
        clearInterval(intervalId);
        intervalId = setInterval(gameLoop, speed);
    }
}

function togglePause() {
    paused = !paused;
    if (paused) {
        clearInterval(intervalId);
    } else {
        intervalId = setInterval(gameLoop, speed);
    }
}

function generateFood() {
    let x, y;
    do {
        x = Math.floor(Math.random() * tileCountX);
        y = Math.floor(Math.random() * tileCountY);
    } while (snake.some(segment => segment.x === x && segment.y === y) || isFoodOnEdge(x, y));
    return { x, y };
}

function isFoodOnEdge(x, y) {
    const edgeChance = getEdgeChance();
    const edge = (x === 0 || x === tileCountX - 1 || y === 0 || y === tileCountY - 1);
    return edge && Math.random() * 100 < edgeChance;
}

function getEdgeChance() {
    if (score >= 300) return 0;
    if (score >= 200) return 5;
    if (score >= 100) return 10;
    if (score >= 50) return 15;
    return 20;
}

window.addEventListener("resize", resizeGame);
document.addEventListener("keydown", changeDirection);

resizeGame();
