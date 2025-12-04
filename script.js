// --- Variables Globales ---
const gameContainer = document.getElementById('game-container');
const bird = document.getElementById('bird');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');
const base = document.getElementById('base');

// Paramètres du jeu
const GAME_WIDTH = 288;   
const GAME_HEIGHT = 512;  
const BASE_HEIGHT = 112;  
const PIPE_WIDTH = 52;    

// === NOUVELLES TAILLES POUR L'OISEAU (selon l'asset) ===
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
// ========================================================

// === PARAMÈTRES DE DIFFICULTÉ ET RÉACTIVITÉ (Flappy Bird Like) ===
const PIPE_GAP = 150;        
const GRAVITY = 0.5;        
const JUMP_VELOCITY = -9;   
const PIPE_VELOCITY = 2;    
const PIPE_GENERATION_DELAY = 1500; 
// =======================================================

// État du jeu
let birdY = 250;
let birdVelocity = 0;
let score = 0;
let isPlaying = false;
let gameInterval;
let pipeGenerationInterval;
let pipes = []; 
let baseOffset = 0; 

// --- Fonctions de base ---

/**
 * Met à jour la position de l'oiseau et applique la gravité.
 */
function applyGravity() {
    birdVelocity += GRAVITY;
    birdY += birdVelocity;
    
    // Rotation de l'oiseau (plongeon/montée)
    const rotation = Math.min(Math.max(-45, birdVelocity * 3), 90); 
    bird.style.transform = `rotate(${rotation}deg)`;
    
    // Collision avec le sol (BASE_HEIGHT)
    if (birdY > GAME_HEIGHT - BASE_HEIGHT - BIRD_HEIGHT) {
        birdY = GAME_HEIGHT - BASE_HEIGHT - BIRD_HEIGHT;
        gameOver();
        return; 
    }
    // Collision avec le plafond
    if (birdY < 0) {
        birdY = 0;
        birdVelocity = 0;
    }

    bird.style.top = `${birdY}px`;
}

/**
 * Fait sauter l'oiseau.
 */
function jump() {
    if (!isPlaying) return;
    birdVelocity = JUMP_VELOCITY;
}

/**
 * Défile le sol pour donner l'impression de mouvement.
 */
function moveBase() {
    baseOffset -= PIPE_VELOCITY;
    if (baseOffset <= -24) { // 24 est la largeur de l'asset base
        baseOffset = 0;
    }
    base.style.backgroundPositionX = `${baseOffset}px`;
}

/**
 * Crée un ensemble de tuyaux (haut et bas).
 */
function createPipe() {
    const minHeight = 50;
    const maxHeight = GAME_HEIGHT - BASE_HEIGHT - PIPE_GAP - 50;
    
    const bottomPipeHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    const topPipeHeight = GAME_HEIGHT - BASE_HEIGHT - bottomPipeHeight - PIPE_GAP;

    const pipeTop = document.createElement('div');
    pipeTop.classList.add('pipe', 'pipe-top');
    pipeTop.style.height = `${topPipeHeight}px`;
    pipeTop.style.top = '0px';
    pipeTop.style.right = '0px'; 

    const pipeBottom = document.createElement('div');
    pipeBottom.classList.add('pipe', 'pipe-bottom');
    pipeBottom.style.height = `${bottomPipeHeight}px`;
    pipeBottom.style.bottom = `${BASE_HEIGHT}px`; // Ancré au-dessus du sol
    pipeBottom.style.right = '0px';

    gameContainer.appendChild(pipeTop);
    gameContainer.appendChild(pipeBottom);

    pipes.push({ 
        top: pipeTop, 
        bottom: pipeBottom, 
        right: 0, 
        scored: false 
    });
}

/**
 * Déplace les tuyaux et vérifie les collisions.
 */
function movePipes() {
    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        
        pipe.right += PIPE_VELOCITY; 

        pipe.top.style.right = `${pipe.right}px`;
        pipe.bottom.style.right = `${pipe.right}px`;

        const birdX = 50;
        const birdBottom = birdY + BIRD_HEIGHT; 
        const birdRight = birdX + BIRD_WIDTH;   

        const pipeLeft = GAME_WIDTH - pipe.right - PIPE_WIDTH;
        const pipeRight = GAME_WIDTH - pipe.right;

        // Détection de Collision (Horizontal)
        if (birdRight > pipeLeft && birdX < pipeRight) {
            
            // Détection de Collision (Vertical)
            const pipeTopHeight = parseInt(pipe.top.style.height);
            const pipeBottomY = GAME_HEIGHT - BASE_HEIGHT - parseInt(pipe.bottom.style.height); 

            if (birdY < pipeTopHeight || birdBottom > pipeBottomY) {
                gameOver();
                return;
            }
        }

        // Mise à jour du Score
        if (birdX > pipeRight && !pipe.scored) {
            score++;
            scoreDisplay.textContent = `${score}`;
            pipe.scored = true;
        }

        // Nettoyage 
        if (pipe.right > GAME_WIDTH) {
            pipe.top.remove();
            pipe.bottom.remove();
            pipes.splice(i, 1);
            i--;
        }
    }
}

/**
 * La boucle principale du jeu.
 */
function gameLoop() {
    if (!isPlaying) return;

    applyGravity();
    movePipes();
    moveBase(); 

    gameInterval = requestAnimationFrame(gameLoop);
}

// --- Contrôle du Jeu ---

function resetBird() {
    birdY = 250;
    birdVelocity = 0;
    bird.style.top = `${birdY}px`;
    bird.style.transform = 'rotate(0deg)'; 
}

function startGame() {
    if (isPlaying) return;

    pipes.forEach(p => { p.top.remove(); p.bottom.remove(); });
    pipes = [];
    
    resetBird(); 
    
    score = 0;
    scoreDisplay.textContent = `0`; 
    messageDisplay.style.display = 'none'; 

    isPlaying = true;
    
    gameLoop();

    pipeGenerationInterval = setInterval(createPipe, PIPE_GENERATION_DELAY);
}

/**
 * Arrête le jeu et affiche l'image Game Over.
 */
function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(gameInterval);
    clearInterval(pipeGenerationInterval);

    // Affichage de l'image Game Over et du bouton
    messageDisplay.innerHTML = `
        <img src="assets/gameover.png" class="game-over-img">
        <span class="final-score">Score Final: ${score}</span>
        <button class="restart-button">REJOUER</button>
    `;
    messageDisplay.style.display = 'flex';

    const restartButton = document.querySelector('.restart-button');
    restartButton.onclick = (e) => {
        e.stopPropagation(); 
        startGame();
    };

    // Empêcher les clics de sauter pendant l'écran Game Over
    gameContainer.onclick = (e) => {};
}


// --- Événements d'Initialisation et de Jeu ---

// Affichage de l'écran d'accueil avec le titre (sans image pour le moment)
messageDisplay.innerHTML = `
    <span class="game-title">FLAPPY BIRD</span>
    <span class="instructions">Cliquez ou appuyez sur Espace pour sauter et commencer !</span>
`;
messageDisplay.style.display = 'flex';

// Gestion du démarrage par clic
gameContainer.onclick = () => {
    if (!isPlaying) {
        startGame();
        gameContainer.onclick = jump; 
    }
};

// Gestion de la barre d'espace
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (!isPlaying) {
            startGame();
            gameContainer.onclick = jump; 
        } else {
            jump();
        }
    }
});