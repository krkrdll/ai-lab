// 定数
const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = -1;

// 状態
let board = [];
let currentPlayer = BLACK;
let gameActive = true;
let lastMove = null;

// DOM要素
const boardElement = document.getElementById('board');
const currentPlayerText = document.getElementById('current-player-text');
const currentPlayerIcon = document.getElementById('current-player-icon');
const scoreBlackElement = document.getElementById('score-black');
const scoreWhiteElement = document.getElementById('score-white');
const scoreBoxBlack = document.getElementById('score-box-black');
const scoreBoxWhite = document.getElementById('score-box-white');
const messageArea = document.getElementById('message-area');
const resetBtn = document.getElementById('reset-btn');
const showHintsCheckbox = document.getElementById('show-hints');
const gameOverModal = document.getElementById('game-over-modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const winnerText = document.getElementById('winner-text');
const finalScoreBlack = document.getElementById('final-score-black');
const finalScoreWhite = document.getElementById('final-score-white');

// 初期化
function initGame() {
    // 盤面の初期化 (0埋め)
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // 初期配置
    const mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = WHITE;
    board[mid][mid] = WHITE;
    board[mid - 1][mid] = BLACK;
    board[mid][mid - 1] = BLACK;

    currentPlayer = BLACK;
    gameActive = true;
    lastMove = null;
    
    closeModal();
    updateUI();
    renderBoard();
    
    // 最初のターンの有効手をチェック
    checkTurn();
}

// 盤面の描画
function renderBoard() {
    boardElement.innerHTML = '';
    const validMoves = getValidMoves(currentPlayer);
    const showHints = showHintsCheckbox.checked;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // 石の表示
            if (board[r][c] !== EMPTY) {
                const disc = document.createElement('div');
                disc.className = `disc ${board[r][c] === BLACK ? 'black' : 'white'}`;
                
                // 最後の手にマーク
                if (lastMove && lastMove.r === r && lastMove.c === c) {
                    disc.classList.add('last-move');
                }
                
                cell.appendChild(disc);
            } else if (gameActive && showHints) {
                // ヒント表示（置ける場所）
                if (validMoves.some(m => m.r === r && m.c === c)) {
                    const hint = document.createElement('div');
                    hint.className = 'hint';
                    cell.appendChild(hint);
                    
                    // クリックイベント
                    cell.addEventListener('click', () => handleCellClick(r, c));
                }
            } else if (gameActive && validMoves.some(m => m.r === r && m.c === c)) {
                 // ヒント非表示でもクリックイベントは必要
                 cell.addEventListener('click', () => handleCellClick(r, c));
            }

            boardElement.appendChild(cell);
        }
    }
}

// セルクリック時の処理
function handleCellClick(r, c) {
    if (!gameActive) return;
    
    const validMoves = getValidMoves(currentPlayer);
    const move = validMoves.find(m => m.r === r && m.c === c);

    if (move) {
        executeMove(move);
    }
}

// 手の実行
function executeMove(move) {
    const { r, c, flipped } = move;

    // 石を置く
    board[r][c] = currentPlayer;

    // 挟んだ石を裏返す
    flipped.forEach(pos => {
        board[pos.r][pos.c] = currentPlayer;
    });

    lastMove = { r, c };

    // ターン交代
    currentPlayer = -currentPlayer;

    // UI更新と盤面再描画
    updateUI();
    renderBoard();

    // 次のターンのチェック（パス判定など）
    setTimeout(checkTurn, 100);
}

// ターンのチェック（パス、ゲーム終了判定）
function checkTurn() {
    const moves = getValidMoves(currentPlayer);

    if (moves.length === 0) {
        // 現在のプレイヤーに置ける場所がない
        const opponentMoves = getValidMoves(-currentPlayer);
        
        if (opponentMoves.length === 0) {
            // 両者置けない -> ゲーム終了
            endGame();
        } else {
            // パス
            showMessage(`${currentPlayer === BLACK ? '黒' : '白'}は置ける場所がありません。パスします。`);
            currentPlayer = -currentPlayer;
            updateUI();
            renderBoard();
            // パスした後、相手の手番もチェック（連続パスの可能性は低いがありえる）
            setTimeout(() => {
                const nextMoves = getValidMoves(currentPlayer);
                if (nextMoves.length === 0) {
                     // 相手も置けないなら終了
                     endGame();
                } else {
                    clearMessageDelayed();
                }
            }, 2000);
        }
    } else {
        // 置ける場所がある -> 通常進行
        // メッセージエリアをクリア
        // messageArea.classList.add('hidden');
    }
}

// 有効な手を取得する
function getValidMoves(player) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== EMPTY) continue;

            const flipped = getFlippedDiscs(r, c, player);
            if (flipped.length > 0) {
                moves.push({ r, c, flipped });
            }
        }
    }
    return moves;
}

// 指定した場所に置いた場合に裏返る石を取得
function getFlippedDiscs(r, c, player) {
    const flipped = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
        let cr = r + dr;
        let cc = c + dc;
        const tempFlipped = [];

        // 盤面内かつ相手の石がある間進む
        while (
            cr >= 0 && cr < BOARD_SIZE &&
            cc >= 0 && cc < BOARD_SIZE &&
            board[cr][cc] === -player
        ) {
            tempFlipped.push({ r: cr, c: cc });
            cr += dr;
            cc += dc;
        }

        // 相手の石の先に自分の石があれば、挟めている
        if (
            cr >= 0 && cr < BOARD_SIZE &&
            cc >= 0 && cc < BOARD_SIZE &&
            board[cr][cc] === player &&
            tempFlipped.length > 0
        ) {
            flipped.push(...tempFlipped);
        }
    }

    return flipped;
}

// スコア計算
function getScore() {
    let black = 0;
    let white = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) black++;
            else if (board[r][c] === WHITE) white++;
        }
    }
    return { black, white };
}

// UI更新
function updateUI() {
    const scores = getScore();
    scoreBlackElement.textContent = scores.black;
    scoreWhiteElement.textContent = scores.white;

    // ターン表示
    if (currentPlayer === BLACK) {
        currentPlayerText.textContent = "黒の番";
        currentPlayerIcon.className = "w-4 h-4 rounded-full bg-black inline-block border border-gray-400";
        scoreBoxBlack.classList.remove('opacity-50');
        scoreBoxWhite.classList.add('opacity-50');
        scoreBoxBlack.classList.add('scale-105', 'shadow-lg');
        scoreBoxWhite.classList.remove('scale-105', 'shadow-lg');
    } else {
        currentPlayerText.textContent = "白の番";
        currentPlayerIcon.className = "w-4 h-4 rounded-full bg-white inline-block border border-gray-400";
        scoreBoxWhite.classList.remove('opacity-50');
        scoreBoxBlack.classList.add('opacity-50');
        scoreBoxWhite.classList.add('scale-105', 'shadow-lg');
        scoreBoxBlack.classList.remove('scale-105', 'shadow-lg');
    }
}

// メッセージ表示
function showMessage(msg) {
    messageArea.textContent = msg;
    messageArea.classList.remove('hidden');
}

function clearMessageDelayed() {
    setTimeout(() => {
        messageArea.classList.add('hidden');
        messageArea.textContent = '';
    }, 2000);
}

// ゲーム終了処理
function endGame() {
    gameActive = false;
    const scores = getScore();
    
    // モーダル表示
    finalScoreBlack.textContent = scores.black;
    finalScoreWhite.textContent = scores.white;
    
    let resultText = "";
    if (scores.black > scores.white) {
        resultText = "黒の勝ち!";
        winnerText.className = "text-xl mb-6 font-bold text-gray-900";
    } else if (scores.white > scores.black) {
        resultText = "白の勝ち!";
        winnerText.className = "text-xl mb-6 font-bold text-gray-500"; 
    } else {
        resultText = "引き分け!";
        winnerText.className = "text-xl mb-6 font-bold text-blue-600";
    }
    winnerText.textContent = resultText;
    
    gameOverModal.classList.remove('hidden');
    // 少し遅延させてアニメーション用クラスを追加
    setTimeout(() => {
        gameOverModal.classList.add('show');
    }, 10);
}

function closeModal() {
    gameOverModal.classList.remove('show');
    setTimeout(() => {
        gameOverModal.classList.add('hidden');
    }, 300);
}

// イベントリスナー
resetBtn.addEventListener('click', initGame);
modalRestartBtn.addEventListener('click', initGame);
showHintsCheckbox.addEventListener('change', renderBoard);

// ゲーム開始
initGame();