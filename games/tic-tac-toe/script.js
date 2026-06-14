const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const btn1p = document.getElementById('btn-1p');
const btn2p = document.getElementById('btn-2p');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreTiesEl = document.getElementById('score-ties');
const playerOName = document.getElementById('player-o-name');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let running = false;
let is1Player = true;
let scores = { X: 0, O: 0, Ties: 0 };

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

initializeGame();

function initializeGame() {
    cells.forEach(cell => cell.addEventListener('click', cellClicked));
    resetBtn.addEventListener('click', resetBoard);
    btn1p.addEventListener('click', () => setMode(true));
    btn2p.addEventListener('click', () => setMode(false));
    running = true;
    updateStatus();
}

function setMode(is1P) {
    if (is1Player === is1P) return;
    is1Player = is1P;
    btn1p.classList.toggle('active', is1P);
    btn2p.classList.toggle('active', !is1P);
    playerOName.textContent = is1P ? 'AI (O)' : 'Player O';
    
    // Reset scores when changing mode
    scores = { X: 0, O: 0, Ties: 0 };
    updateScoreDisplay();
    resetBoard();
}

function cellClicked() {
    const cellIndex = this.getAttribute('data-index');

    if (board[cellIndex] !== '' || !running) {
        return;
    }

    // If it's 1 player mode and it's O's turn, the player cannot click.
    if (is1Player && currentPlayer === 'O') {
        return;
    }

    updateCell(this, cellIndex);
    checkWinner();

    if (running && is1Player && currentPlayer === 'O') {
        statusText.textContent = `AI is thinking...`;
        statusText.style.color = 'var(--accent-o)';
        setTimeout(makeAIMove, 500); // Add a small delay for UX so it feels like AI is "thinking"
    }
}

function updateCell(cell, index) {
    board[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
}

function updateStatus() {
    statusText.textContent = `Player ${currentPlayer}'s turn`;
    statusText.style.color = currentPlayer === 'X' ? 'var(--accent-x)' : 'var(--accent-o)';
}

function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

function checkWinner() {
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = `${currentPlayer} WINS!`;
        statusText.style.color = currentPlayer === 'X' ? 'var(--accent-x)' : 'var(--accent-o)';
        running = false;
        scores[currentPlayer]++;
        updateScoreDisplay();
        highlightWinningCells(winningCells);
    } else if (!board.includes('')) {
        statusText.textContent = 'DRAW!';
        statusText.style.color = 'var(--text-primary)';
        running = false;
        scores.Ties++;
        updateScoreDisplay();
    } else {
        changePlayer();
    }
}

function highlightWinningCells(winningCells) {
    winningCells.forEach(index => {
        cells[index].classList.add('win');
    });
}

function updateScoreDisplay() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreTiesEl.textContent = scores.Ties;
}

function resetBoard() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
    running = true;
    updateStatus();
}

function makeAIMove() {
    if (!running) return;

    let bestScore = -Infinity;
    let move;
    
    // To make it slightly beatable instead of pure perfect play, we can add a small randomness factor
    // But minimax is fine for a solid AI
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    if (move !== undefined) {
        const cell = document.querySelector(`.cell[data-index="${move}"]`);
        updateCell(cell, move);
        checkWinner();
    }
}

// Minimax algorithm for unbeatable AI
function minimax(board, depth, isMaximizing) {
    let result = checkWinnerForMinimax();
    if (result !== null) {
        if (result === 'O') return 10 - depth;
        if (result === 'X') return -10 + depth;
        return 0; // Tie
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinnerForMinimax() {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) return 'tie';
    return null;
}
