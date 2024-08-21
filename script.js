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

	@@ -85,12 +93,16 @@ function gameLoop() {
        clearInterval(intervalId);
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
	@@ -101,6 +113,7 @@ function gameLoop() {

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verifica colisão com bordas e com o próprio corpo
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        if (score > highScore) {
	@@ -112,27 +125,93 @@ function gameLoop() {

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
	@@ -149,57 +228,75 @@ function updateScore() {
}

function updateSpeed() {
    if (score % 5 === 0 && score > 0) {
        speed = Math.max(speed - 10, 50); // Aumenta a dificuldade conforme o score
        clearInterval(intervalId);
        intervalId = setInterval(gameLoop, speed);
    }
}

function generateFood() {
    let x, y;
    do {
        x = Math.floor(Math.random() * tileCountX);
        y = Math.floor(Math.random() * tileCountY);
    } while (snake.some(segment => segment.x === x && segment.y === y));

    // Decide o tipo de comida
    let type = 'normal';
    if (score >= 1) {
        // Permite que comidas especiais apareçam
        if (foodCounter === 0) {
            if (Math.random() < 0.5) { // 50% de chance de comida especial
                do {
                    type = ['freeze', 'speed', 'multiply'][Math.floor(Math.random() * 3)];
                } while (type === lastFoodType); // Evita repetir o mesmo tipo de comida especial
            }
        }
        lastFoodType = type; // Atualiza o último tipo de comida
    }

    return { x, y, type };
}

function addPulseEffect(type) {
    const canvasElement = document.getElementById('gameCanvas');
    canvasElement.style.transition = 'border 1s ease-in-out';
    switch (type) {
        case 'freeze':
            canvasElement.style.border = '5px solid #ADD8E6';
            break;
        case 'speed':
            canvasElement.style.border = '5px solid #FA8072';
            break;
        case 'multiply':
            canvasElement.style.border = '5px solid #00FF00';
            break;
    }
    setTimeout(() => {
        canvasElement.style.border = '5px solid #282828'; // Reseta a borda
    }, 1000);
}

function togglePause() {
    const overlay = document.getElementById('pauseOverlay');

    if (paused) {
        paused = false;
        intervalId = setInterval(gameLoop, speed);
        if (overlay) {
            overlay.style.display = 'none'; // Ocultar o overlay quando o jogo é retomado
        }
    } else {
        paused = true;
        clearInterval(intervalId);
        if (overlay) {
            overlay.style.display = 'block'; // Mostrar o overlay quando o jogo está pausado
        }
    }
}

window.addEventListener('resize', resizeGame);
document.addEventListener('keydown', changeDirection);
resizeGame();
