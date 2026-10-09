export const WINNING_LINES = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diagonal 1
  [2, 4, 6]  // Diagonal 2
];

export function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c], isDraw: false };
    }
  }

  const isDraw = board.every((cell) => cell !== null);
  if (isDraw) {
    return { winner: null, line: null, isDraw: true };
  }

  return { winner: null, line: null, isDraw: false };
}

export function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

// Minimax algorithm for unbeatable AI
function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
  const result = checkWinner(board);
  if (result.winner === aiPlayer) return 10 - depth;
  if (result.winner === humanPlayer) return depth - 10;
  if (result.isDraw) return 0;

  const available = getAvailableMoves(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of available) {
      board[move] = aiPlayer;
      const score = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
      board[move] = null;
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of available) {
      board[move] = humanPlayer;
      const score = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
      board[move] = null;
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}

export function getAIMove(board, aiPlayer = 'O', humanPlayer = 'X', difficulty = 'hard') {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  // Easy mode: random pick
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Medium mode: 60% smart, 40% random
  if (difficulty === 'medium' && Math.random() < 0.4) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Hard mode: Minimax
  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    board[move] = aiPlayer;
    const score = minimax(board, 0, false, aiPlayer, humanPlayer);
    board[move] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
