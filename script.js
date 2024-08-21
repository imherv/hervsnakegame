const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileCountX, tileCountY, gridSize;

function resizeGame() {
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    const size = Math.min(containerWidth, containerHeight, 300); // Ajuste do tamanho máximo

    gridSize = Math.floor(size / 20); // Tamanho dinâmico do grid
    canvas.width = canvas.height = size;

    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);

    if (!gameOver) {
        initGame();
    }
}

let snake = [];
let food = [];
let direction = {};
let newDirection = {};
let gameOver = false;
let speed = 250; // Velocidade inicial
let intervalId;
let score = 0;
let highScore = 0;
let paused = false;
let foodCounter = 0; // Contador para comidas comuns
let freezeTimeout = null; // Timeout para comida de congelamento
let lastFoodType = 'normal'; // Último tipo de comida coletada
let specialFoodCounter = 0; // Contador para comidas especiais
let specialFoodActive = { freeze: false, speed: false }; // Verifica se o efeito especial está ativo

// Função para salvar a maior pontuação
function saveHighScore(score) {
    let storedHighScore = localStorage.getItem('highScore');
    if (!storedHighScore || score > storedHighScore) {
        localStorage.setItem('highScore', score);
        highScore = score; // Atualiza a variável highScore
    }
}

// Função para obter a maior pontuação
function getHighScore() {
    return localStorage.getItem('highScore') || 0;
}

function initGame() {
    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }
    ];
    food = [generateFood()];
    direction = { x: 1, y: 0 };
    newDirection = { x: 1, y: 0 };
    gameOver = false;
    paused = false;
    score = 0;
    speed = 250; // Reseta a velocidade inicial
    updateSpeed();
    updateScore();

    // Carrega a maior pontuação
    highScore = getHighScore();
    updateScore();

    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(gameLoop, speed);

    // Ocultar o overlay quando o jogo reinicia
    const overlay = document.getElementById("gameOverOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
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
        saveHighScore(score); // Salva a maior pontuação ao final do jogo
        const overlay = document.getElementById("gameOverOverlay");
        if (overlay) {
            overlay.innerHTML = `<p>Você colidiu! Clique ou aperte R para tentar novamente.</p><button onclick="initGame()">OK</button>`;
            overlay.style.display = "block";
            overlay.style.position = "absolute";
            overlay.style.top = "50%";
            overlay.style.left = "50%";
            overlay.style.transform = "translate(-50%, -50%)";
            overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
            overlay.style.color = "white";
            overlay.style.padding = "20px";
            overlay.style.borderRadius = "10px";
        }
        return;
    }

    if (paused) return;

    direction = newDirection; // Atualiza a direção com a nova direção

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verifica colisão com bordas e com o próprio corpo
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
        }
        updateScore();
        return;
    }

    snake.unshift(head);

    const foodIndex = food.findIndex(f => head.x === f.x && head.y === f.y);

    if (foodIndex !== -1) {
        const collectedFood = food[foodIndex];
        food.splice(foodIndex, 1); // Remove a comida coletada

        if (collectedFood.type === 'freeze') {
            // Diminui a velocidade da cobra por 5 segundos
            if (!specialFoodActive.freeze) {
                const originalSpeed = speed;
                speed = Math.min(Math.max(speed + 50, 250), 250); // Aumenta a velocidade até o máximo de 250ms
                clearInterval(intervalId);
                intervalId = setInterval(gameLoop, speed);
                if (freezeTimeout) clearTimeout(freezeTimeout);
                freezeTimeout = setTimeout(() => {
                    speed = originalSpeed;
                    clearInterval(intervalId);
                    intervalId = setInterval(gameLoop, speed);
                    specialFoodActive.freeze = false;
                }, 5000);
                specialFoodActive.freeze = true;
            }
            addPulseEffect('freeze'); // Pulsar borda para comida de congelamento
        } else if (collectedFood.type === 'multiply') {
            // Duplica a comida adicionando 2 novas comidas
            const newFood1 = generateFood();
            let newFood2;
            do {
                newFood2 = generateFood();
            } while (newFood2.x === newFood1.x && newFood2.y === newFood1.y);
            food = [newFood1, newFood2];
            addPulseEffect('multiply'); // Pulsar borda para comida de multiplicação
        } else if (collectedFood.type === 'speed') {
            // Aumenta a velocidade da cobra por 5 segundos
            if (!specialFoodActive.speed) {
                const originalSpeed = speed;
                speed = Math.max(speed - 50, 50); // Diminui a velocidade até o mínimo de 50ms
                clearInterval(intervalId);
                intervalId = setInterval(gameLoop, speed);
                setTimeout(() => {
                    speed = originalSpeed;
                    clearInterval(intervalId);
                    intervalId = setInterval(gameLoop, speed);
                    specialFoodActive.speed = false;
                }, 5000);
                specialFoodActive.speed = true;
            }
            addPulseEffect('speed'); // Pulsar borda para comida de velocidade
        }

        score++;
        foodCounter = 0; // Reseta o contador de comidas comuns
        food.push(generateFood()); // Gera nova comida
        updateScore();
        updateSpeed();
    } else {
        snake.pop();
        foodCounter++;
    }

    ctx.fillStyle = "#500087"; // Cor do fundo
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    food.forEach(f => {
        ctx.fillStyle = getFoodColor(f.type); // Define a cor com base no tipo de comida
        ctx.beginPath();
        ctx.arc(f.x * gridSize + gridSize / 2, f.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "#FFFFFF"; // Cor da cobra
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

function getFoodColor(type) {
    switch (type) {
        case 'freeze':
            return '#ADD8E6'; // Cor para comida de congelamento
        case 'speed':
            return '#FA8072'; // Cor para comida de velocidade
        case 'multiply':
            return '#00FF00'; // Cor para comida de multiplicação
        default:
            return '#FFFCE7'; // Cor padrão para comida comum
    }
}

function updateScore() {
    const scoreElement = document.getElementById("score");
    const highScoreElement = document.getElementById("highScore");

    if (scoreElement) {
        scoreElement.innerText = `Atual: ${score}`;
    }

    if (highScoreElement) {
        highScoreElement.innerText = `Maior: ${highScore}`;
    }
}

function updateSpeed() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(gameLoop, speed);
}

function addPulseEffect(type) {
    const pulseColor = type === 'freeze' ? '#ADD8E6' :
        type === 'speed' ? '#FA8072' :
        type === 'multiply' ? '#00FF00' : '#FFFCE7';

    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.stroke();

    setTimeout(() => {
        ctx.strokeStyle = "#500087";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.stroke();
    }, 500); // Pulsar por 0.5 segundo
}

function generateFood() {
    let x, y;
    do {
        x = Math.floor(Math.random() * tileCountX);
        y = Math.floor(Math.random() * tileCountY);
    } while (snake.some(segment => segment.x === x && segment.y === y));

    // Determine o tipo de comida
    let type = 'normal';
    if (score >= 10 && Math.random() < 0.2 && foodCounter % 5 === 0) {
        type = 'freeze';
    } else if (score >= 2 && Math.random() < 0.2 && foodCounter % 5 === 0) {
        type = 'speed';
    } else if (Math.random() < 0.25) {
        type = 'multiply';
    }

    return { x, y, type };
}

function togglePause() {
    paused = !paused;
    const overlay = document.getElementById("pauseOverlay");
    if (paused) {
        if (overlay) {
            overlay.style.display = "block";
        }
    } else {
        if (overlay) {
            overlay.style.display = "none";
        }
    }
}

document.addEventListener("keydown", changeDirection);

resizeGame();
window.addEventListener("resize", resizeGame);
