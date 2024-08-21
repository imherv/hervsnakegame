const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileCountX, tileCountY, gridSize;
let snake = [];
let food = [];
let direction = {};
let newDirection = {};
let gameOver = false;
let speed = 250;
let intervalId;
let score = 0;
let paused = false;
let foodCounter = 0;
let freezeTimeout = null;
let lastFoodType = 'normal';
let specialFoodCounter = 0;
let specialFoodActive = { freeze: false, speed: false };
let highScore = parseInt(localStorage.getItem('highScore')) || 0;

function resizeGame() {
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = canvas.parentElement.clientHeight;
    const size = Math.min(containerWidth, containerHeight, 300);

    gridSize = Math.floor(size / 20);
    canvas.width = canvas.height = size;

    tileCountX = Math.floor(canvas.width / gridSize);
    tileCountY = Math.floor(canvas.height / gridSize);

    if (!gameOver) {
        initGame();
    }
}

// Função para salvar o highScore no localStorage
function saveHighScore() {
    localStorage.setItem('highScore', highScore);
}

function generateFood() {
    const specialFoodChance = 0.25;
    const specialFoodTypes = ['freeze', 'speed', 'multiply'];
    const isSpecialFood = Math.random() < specialFoodChance;

    let foodType = 'normal';
    if (isSpecialFood && specialFoodCounter < 1) {
        foodType = specialFoodTypes[Math.floor(Math.random() * specialFoodTypes.length)];
        specialFoodCounter++;
    } else {
        specialFoodCounter = 0;
    }

    let foodPosition;
    let validPosition = false;
    while (!validPosition) {
        foodPosition = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };

        // Verifica se a posição da comida não está sobre o corpo da cobra
        validPosition = !snake.some(segment => segment.x === foodPosition.x && segment.y === foodPosition.y);
    }

    return {
        ...foodPosition,
        type: foodType
    };
}

function initGame() {
    loadHighScore(); // Carrega o highScore ao iniciar o jogo

    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }
    ];
    food = [generateFood()]; // Gera comida inicial
    direction = { x: 1, y: 0 };
    newDirection = { x: 1, y: 0 };
    gameOver = false; // Garante que o jogo não esteja em estado de game over ao iniciar
    paused = false;
    score = 0;
    speed = 250; // Define a velocidade inicial
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(gameLoop, speed);
    updateSpeed();
    updateScore();

    // Ocultar o overlay quando o jogo reinicia
    const overlay = document.getElementById("gameOverOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

let lastDirectionChange = Date.now(); // Tempo da última mudança de direção

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(event) {
    // Captura a posição inicial do toque
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchMove(event) {
    // Captura a posição final do toque
    const touch = event.touches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    // Calcula a diferença entre a posição inicial e final
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determina a direção do movimento
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Movimento horizontal
        if (deltaX > 0) {
            // Movimento para a direita
            if (direction.x === 0) newDirection = { x: 1, y: 0 };
        } else {
            // Movimento para a esquerda
            if (direction.x === 0) newDirection = { x: -1, y: 0 };
        }
    } else {
        // Movimento vertical
        if (deltaY > 0) {
            // Movimento para baixo
            if (direction.y === 0) newDirection = { x: 0, y: 1 };
        } else {
            // Movimento para cima
            if (direction.y === 0) newDirection = { x: 0, y: -1 };
        }
    }

    // Atualiza a posição inicial para o próximo movimento
    touchStartX = touchEndX;
    touchStartY = touchEndY;
}

function handleTouchEnd(event) {
    // Função opcional: pode ser usada para adicionar lógica quando o toque é finalizado
}

// Adiciona os ouvintes de eventos de toque ao canvas
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function changeDirection(event) {
    if (event.type === 'keydown') {
        // Eventos de teclado
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
    } else if (event.type === 'touchstart') {
        // Eventos de toque
        const touch = event.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        if (touchX < centerX && touchY < centerY) {
            // Cima e Esquerda
            if (direction.x === 0) newDirection = { x: -1, y: -1 };
        } else if (touchX > centerX && touchY < centerY) {
            // Cima e Direita
            if (direction.x === 0) newDirection = { x: 1, y: -1 };
        } else if (touchX < centerX && touchY > centerY) {
            // Baixo e Esquerda
            if (direction.x === 0) newDirection = { x: -1, y: 1 };
        } else if (touchX > centerX && touchY > centerY) {
            // Baixo e Direita
            if (direction.x === 0) newDirection = { x: 1, y: 1 };
        }
    } const keyCode = event.keyCode;

    switch (keyCode) {
        case 37: // Esquerda
            if (direction.x === 0) newDirection = { x: -1, y: 0 };
            break;
        case 38: // Cima
            if (direction.y === 0) newDirection = { x: 0, y: -1 };
            break;
        case 39: // Direita
            if (direction.x === 0) newDirection = { x: 1, y: 0 };
            break;
        case 40: // Baixo
            if (direction.y === 0) newDirection = { x: 0, y: 1 };
            break;
    }
}

// Função que verifica e atualiza o highScore se necessário
function checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore(); // Salva o novo highScore
    }
}

function gameLoop() {
    if (gameOver) {
        clearInterval(intervalId);
        checkAndUpdateHighScore();

        const overlay = document.getElementById("gameOverOverlay");
        if (overlay) {
            overlay.innerHTML = '<p>Você colidiu! Clique ou aperte R para tentar novamente.</p><button onclick="initGame()">OK</button>';
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

        updateScore();
        return;
    }

    if (paused) return;

    direction = newDirection; // Atualiza a direção com a nova direção

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verifica colisão com bordas e com o próprio corpo
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        checkAndUpdateHighScore(); // Verifica e atualiza o high score no fim do jogo
        updateScore(); // Atualiza a pontuação e o high score no final do jogo
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

requestAnimationFrame(gameLoop); // Usa requestAnimationFrame para uma animação mais suave

function getFoodColor(type) {
    switch(type) {
        case 'freeze':
            return '#ADD8E6'; // Azul claro para comida de congelamento
        case 'speed':
            return '#FA8072'; // Salmão para comida de velocidade
        case 'multiply':
            return '#00FF00'; // Verde limão para comida de multiplicação
        case 'normal':
            return '#FFFFFF'; // Branco para comida normal
        default:
            return '#282828'; // Cor padrão para borda
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
    if (score % 5 === 0 && score > 0) {
        speed = Math.max(speed - 10, 50); // Aumenta a dificuldade conforme o score
        clearInterval(intervalId);
        intervalId = setInterval(gameLoop, speed);
    }
}

function generateFood() {
    const specialFoodChance = 0.25;
    const specialFoodTypes = ['freeze', 'speed', 'multiply'];
    const isSpecialFood = Math.random() < specialFoodChance;

    let foodType = 'normal';
    if (isSpecialFood && specialFoodCounter < 1) {
        foodType = specialFoodTypes[Math.floor(Math.random() * specialFoodTypes.length)];
        specialFoodCounter++;
    } else {
        specialFoodCounter = 0;
    }

    return {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY),
        type: foodType
    };
}

let currentPulseTimeout = null;

function addPulseEffect(type) {
    const overlay = document.getElementById("gameCanvas");
    let pulseColor;
    let pulseDuration;

    // Define a cor e a duração da pulsação com base no tipo de comida
    switch (type) {
        case 'freeze':
            pulseColor = '#ADD8E6'; // Cor para comida de congelamento
            pulseDuration = 5000; // Duração de 5 segundos
            break;
        case 'speed':
            pulseColor = '#FA8072'; // Cor para comida de velocidade
            pulseDuration = 5000; // Duração de 5 segundos
            break;
        case 'multiply':
            pulseColor = '#00FF00'; // Cor para comida de multiplicação
            pulseDuration = 750; // Pulsação única
            break;
        default:
            return;
    }

    // Remove qualquer animação de pulsação anterior
    if (currentPulseTimeout) {
        clearTimeout(currentPulseTimeout);
    }
    overlay.style.animation = "none";
    overlay.style.border = `5px solid #282828`;

    // Adiciona uma folha de estilo temporária para as animações
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.id = "pulseAnimationStyles";
    styleSheet.innerHTML = `
        @keyframes pulse {
            0% { border-color: ${pulseColor}; }
            50% { border-color: rgba(${parseInt(pulseColor.slice(1, 3), 16)}, ${parseInt(pulseColor.slice(3, 5), 16)}, ${parseInt(pulseColor.slice(5, 7), 16)}, 0.5); }
            100% { border-color: ${pulseColor}; }
        }

        @keyframes pulse-once {
            0% { border-color: ${pulseColor}; }
            100% { border-color: ${pulseColor}; }
        }
    `;
    document.head.appendChild(styleSheet);

    // Define a nova animação de pulsação
    overlay.style.border = `5px solid ${pulseColor}`;
    overlay.style.animation = `pulse ${pulseDuration}ms ${type === 'multiply' ? 'forwards' : 'infinite'}`;

    // Define um timeout para restaurar a borda padrão após a pulsação
    currentPulseTimeout = setTimeout(() => {
        overlay.style.border = `5px solid #282828`;
        overlay.style.animation = "none";
        // Remove a folha de estilo temporária
        const oldStyleSheet = document.getElementById("pulseAnimationStyles");
        if (oldStyleSheet) {
            oldStyleSheet.remove();
        }
    }, pulseDuration);
}

function togglePause() {
    if (!paused) {
        clearInterval(intervalId);
        paused = true;
        document.getElementById("pauseOverlay").style.display = "block";
    } else {
        intervalId = setInterval(gameLoop, speed);
        paused = false;
        document.getElementById("pauseOverlay").style.display = "none";
    }
}

function loadHighScore() {
    const savedScore = parseInt(localStorage.getItem('highScore'));
    if (!isNaN(savedScore)) {
        highScore = savedScore;
    } else {
        highScore = 0; // Se não houver valor salvo, inicia com 0
    }
    updateScore(); // Atualiza a tela com o highScore carregado
}

document.getElementById('btn-up').addEventListener('click', () => changeDirection({ keyCode: 38 })); // Cima
document.getElementById('btn-down').addEventListener('click', () => changeDirection({ keyCode: 40 })); // Baixo
document.getElementById('btn-left').addEventListener('click', () => changeDirection({ keyCode: 37 })); // Esquerda
document.getElementById('btn-right').addEventListener('click', () => changeDirection({ keyCode: 39 })); // Direita

document.getElementById('btn-up').addEventListener('touchstart', () => changeDirection({ keyCode: 38 })); // Cima
document.getElementById('btn-down').addEventListener('touchstart', () => changeDirection({ keyCode: 40 })); // Baixo
document.getElementById('btn-left').addEventListener('touchstart', () => changeDirection({ keyCode: 37 })); // Esquerda
document.getElementById('btn-right').addEventListener('touchstart', () => changeDirection({ keyCode: 39 })); // Direita

document.addEventListener('DOMContentLoaded', () => {
    // Adicione o intervalo inicial aqui, se necessário
    // intervalId = setInterval(gameLoop, speed);

    document.getElementById('btn-pause').addEventListener('click', () => {
        if (!paused) {
            clearInterval(intervalId); // Limpa o intervalo para pausar o jogo
            paused = true;
            document.getElementById("pauseOverlay").style.display = "block";
        } else {
            intervalId = setInterval(gameLoop, speed); // Reinicia o intervalo para retomar o jogo
            paused = false;
            document.getElementById("pauseOverlay").style.display = "none";
        }
    });

    document.getElementById('btn-pause').addEventListener('touchstart', () => {
        if (!paused) {
            clearInterval(intervalId); // Limpa o intervalo para pausar o jogo
            paused = true;
            document.getElementById("pauseOverlay").style.display = "block";
        } else {
            intervalId = setInterval(gameLoop, speed); // Reinicia o intervalo para retomar o jogo
            paused = false;
            document.getElementById("pauseOverlay").style.display = "none";
        }
    });

});

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

window.addEventListener("keydown", changeDirection);
window.addEventListener("resize", resizeGame);

resizeGame();
initGame();
