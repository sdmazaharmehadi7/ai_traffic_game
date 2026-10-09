import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Bot,
  Trophy,
  Undo2
} from 'lucide-react';
import { checkWinner, getAIMove } from './utils/minimax';
import { sounds } from './utils/audio';

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' | 'pvp'
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' | 'medium' | 'hard'
  const [playerSymbol, setPlayerSymbol] = useState('X'); // 'X' | 'O'
  const [soundMuted, setSoundMuted] = useState(false);
  const [history, setHistory] = useState([]);

  // Scores
  const [scores, setScores] = useState({
    X: 0,
    O: 0,
    draws: 0
  });

  const winnerInfo = checkWinner(board);
  const isGameOver = Boolean(winnerInfo.winner || winnerInfo.isDraw);
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const isAITurn = gameMode === 'ai' && !isGameOver && ((isXNext && aiSymbol === 'X') || (!isXNext && aiSymbol === 'O'));

  // Sync audio mute
  useEffect(() => {
    sounds.enabled = !soundMuted;
  }, [soundMuted]);

  // Handle a completed move and update scores
  const applyMove = useCallback((newBoard, currentTurn) => {
    setBoard(newBoard);
    setIsXNext(currentTurn === 'O');

    const result = checkWinner(newBoard);
    if (result.winner) {
      sounds.playWin();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 }
      });
      setScores((prev) => ({
        ...prev,
        [result.winner]: prev[result.winner] + 1
      }));
    } else if (result.isDraw) {
      sounds.playDraw();
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1
      }));
    } else {
      if (currentTurn === 'X') {
        sounds.playX();
      } else {
        sounds.playO();
      }
    }
  }, []);

  // Handle human cell click
  const handleCellClick = useCallback((index) => {
    if (board[index] || isGameOver || isAITurn) return;

    const currentTurn = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[index] = currentTurn;

    setHistory((prev) => [...prev, board]);
    applyMove(newBoard, currentTurn);
  }, [board, isGameOver, isAITurn, isXNext, applyMove]);

  // AI Move execution
  useEffect(() => {
    if (isAITurn) {
      const timer = setTimeout(() => {
        const move = getAIMove(board, aiSymbol, playerSymbol, difficulty);
        if (move !== null && move !== undefined) {
          const newBoard = [...board];
          newBoard[move] = aiSymbol;

          setHistory((prev) => [...prev, board]);
          applyMove(newBoard, aiSymbol);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [isAITurn, board, aiSymbol, playerSymbol, difficulty, applyMove]);

  // Reset round
  const handleResetRound = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setHistory([]);
    sounds.playX();
  };

  // Reset all scores
  const handleResetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    handleResetRound();
  };

  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isGameOver) return;

    if (gameMode === 'ai') {
      if (history.length >= 2) {
        const targetBoard = history[history.length - 2];
        setHistory((prev) => prev.slice(0, -2));
        setBoard(targetBoard);
      } else if (history.length === 1) {
        setBoard(Array(9).fill(null));
        setHistory([]);
        setIsXNext(true);
      }
    } else {
      const prevBoard = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setBoard(prevBoard);
      setIsXNext(!isXNext);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-between p-4 selection:bg-cyan-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-rose-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            ✕◯
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white m-0 p-0 leading-tight">
              Tic Tac Toe
            </h1>
            <span className="text-[10px] text-slate-400">
              {gameMode === 'ai' ? `vs AI (${difficulty.toUpperCase()})` : '2 Players (Pass & Play)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={handleResetRound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md flex flex-col items-center gap-4 my-auto">
        {/* Game Mode & Options Bar */}
        <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setGameMode('ai');
                handleResetRound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI</span>
            </button>
            <button
              onClick={() => {
                setGameMode('pvp');
                handleResetRound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gameMode === 'pvp'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2 Players</span>
            </button>
          </div>

          {/* AI Settings */}
          {gameMode === 'ai' && (
            <div className="flex items-center gap-1.5">
              {/* Symbol selector */}
              <button
                onClick={() => {
                  setPlayerSymbol((prev) => (prev === 'X' ? 'O' : 'X'));
                  handleResetRound();
                }}
                className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white cursor-pointer"
                title="Change Player Symbol"
              >
                You: {playerSymbol}
              </button>

              {/* Difficulty selector */}
              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  handleResetRound();
                }}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Unbeatable</option>
              </select>
            </div>
          )}
        </div>

        {/* Scoreboard Cards */}
        <div className="w-full grid grid-cols-3 gap-2 text-center font-mono">
          <div
            className={`p-2.5 rounded-2xl border transition-all ${
              !isGameOver && isXNext
                ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="text-[10px] font-sans font-bold text-cyan-400 flex items-center justify-center gap-1">
              <span>PLAYER X</span>
              {gameMode === 'ai' && playerSymbol === 'X' && <span className="text-[9px] text-slate-400">(You)</span>}
            </div>
            <div className="text-xl font-black text-cyan-300 mt-0.5">{scores.X}</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] font-sans font-bold text-slate-400">DRAWS</div>
            <div className="text-xl font-black text-slate-300 mt-0.5">{scores.draws}</div>
          </div>

          <div
            className={`p-2.5 rounded-2xl border transition-all ${
              !isGameOver && !isXNext
                ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="text-[10px] font-sans font-bold text-rose-400 flex items-center justify-center gap-1">
              <span>PLAYER O</span>
              {gameMode === 'ai' && aiSymbol === 'O' && <span className="text-[9px] text-slate-400">(AI)</span>}
            </div>
            <div className="text-xl font-black text-rose-300 mt-0.5">{scores.O}</div>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="w-full py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {winnerInfo.winner ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Trophy className="w-4 h-4 text-amber-400" />
                Winner: Player {winnerInfo.winner}!
              </span>
            ) : winnerInfo.isDraw ? (
              <span className="font-bold text-slate-300">
                🤝 Game Draw! Well played.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    isXNext ? 'bg-cyan-400' : 'bg-rose-400'
                  }`}
                />
                Turn: {isXNext ? 'Player X' : 'Player O'}
                {isAITurn && <span className="text-rose-400 font-mono text-[10px] ml-1">(Thinking...)</span>}
              </span>
            )}
          </div>

          {history.length > 0 && !isGameOver && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Undo last move"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>

        {/* 3x3 Tic Tac Toe Grid */}
        <div className="w-full aspect-square max-w-[360px] bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-3 shadow-2xl grid grid-cols-3 gap-2.5">
          {board.map((cell, index) => {
            const isWinningCell = winnerInfo.line?.includes(index);

            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={Boolean(cell || isGameOver || isAITurn)}
                className={`relative flex items-center justify-center rounded-2xl text-4xl sm:text-5xl font-black transition-all cursor-pointer ${
                  isWinningCell
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                    : cell
                    ? 'bg-slate-800/80 border border-slate-700/60'
                    : 'bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 active:scale-95'
                }`}
              >
                {cell === 'X' && (
                  <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-fadeIn">
                    ✕
                  </span>
                )}
                {cell === 'O' && (
                  <span className="text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-fadeIn">
                    ◯
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Action Buttons */}
        <div className="w-full flex items-center gap-2">
          <button
            onClick={handleResetRound}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Round</span>
          </button>

          <button
            onClick={handleResetScores}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="Reset match scores"
          >
            Reset Score
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-2">
        Tic Tac Toe • Minimax AI Algorithm & 2-Player Local Game
      </footer>
    </div>
  );
}
