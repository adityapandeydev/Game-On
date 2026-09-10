import React, { useState, useEffect, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import Leaderboard from './Leaderboard';

interface TicTacToeProps {
    userId?: string;
}

interface GameState {
    currentScore: number;
    currentStreak: number;
    highestScore: number;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ userId }) => {
    const [board, setBoard] = useState<string[]>(Array(9).fill(""));
    const [currentPlayer, setCurrentPlayer] = useState<string>("O");
    const [winner, setWinner] = useState<string | null>(null);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState("Choose who goes first!");
    const [gameState, setGameState] = useState<GameState>({
        currentScore: 0,
        currentStreak: 0,
        highestScore: 0
    });

    // Fetch initial game state
    useEffect(() => {
        const fetchGameState = async () => {
            if (!userId) return;
            try {
                const stats = await ScoreService.getUserGameStats('tictactoe', userId);
                setGameState({
                    currentScore: stats.currentScore || 0,
                    currentStreak: stats.currentStreak || 0,
                    highestScore: stats.highestScore || 0
                });
            } catch (error) {
                console.error('Failed to fetch game stats:', error);
            }
        };
        fetchGameState();
    }, [userId]);

    const calculateScoreIncrease = (streak: number): number => {
        const baseScore = 20;
        if (streak === 1) return baseScore;
        const multiplier = 1 + ((streak - 1) * 0.1);
        return Math.round(baseScore * multiplier);
    };

    const handleGameEnd = useCallback(async (winner: string | null) => {
        setGameOver(true);
        let resultMessage = "";
        let currentScore = 0;

        if (winner === 'O') { // Player wins
            const newStreak = gameState.currentStreak + 1;
            const scoreIncrease = calculateScoreIncrease(newStreak);
            currentScore = gameState.currentScore + scoreIncrease;
            resultMessage = `🎉 You Win! +${scoreIncrease} points! (${newStreak}x streak)`;
            
            // Only try to save score on wins
            if (userId) {
                try {
                    console.log('Saving score:', currentScore); // Debug log
                    await ScoreService.saveScore('tictactoe', userId, currentScore);
                    console.log('Score saved successfully'); // Debug log
                } catch (error) {
                    console.error('Failed to save score:', error);
                }
            }
        } else if (winner === null) {
            currentScore = 10; // Fixed score for draw
            resultMessage = `😐 It's a Draw! +10 points (streak reset)`;
        } else {
            resultMessage = "❌ Bot Wins! Streak reset!";
        }

        setMessage(resultMessage);
        setGameState(prev => ({
            ...prev,
            currentScore: currentScore,
            currentStreak: winner === 'O' ? prev.currentStreak + 1 : 0
        }));
        
        setRefreshLeaderboard(prev => prev + 1);
    }, [gameState, userId]);

    const checkWinner = useCallback((boardState: string[], mark: string): boolean => {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6],
        ];
        return winPatterns.some((pattern) => pattern.every((index) => boardState[index] === mark));
    }, []);

    const minimax = useCallback((newBoard: string[], isMaximizing: boolean) => {
        const emptyCells = newBoard
            .map((cell, index) => (cell === "" ? index : null))
            .filter((cell): cell is number => cell !== null);

        if (checkWinner(newBoard, "X")) {
            return { score: 10, index: -1 };
        } else if (checkWinner(newBoard, "O")) {
            return { score: -10, index: -1 };
        } else if (emptyCells.length === 0) {
            return { score: 0, index: -1 };
        }

        const moves: { index: number; score: number }[] = [];
        for (const i of emptyCells) {
            const move = { index: i, score: 0 };
            newBoard[i] = isMaximizing ? "X" : "O";
            const result = minimax(newBoard, !isMaximizing);
            move.score = result.score;
            newBoard[i] = "";
            moves.push(move);
        }

        return isMaximizing
            ? moves.reduce((best, move) => (move.score > best.score ? move : best), { score: -Infinity, index: -1 })
            : moves.reduce((best, move) => (move.score < best.score ? move : best), { score: Infinity, index: -1 });
    }, [checkWinner]);

    const makeMove = useCallback((position: number) => {
        if (board[position] !== "" || winner) return;

        const newBoard = [...board];
        newBoard[position] = currentPlayer;
        setBoard(newBoard);

        if (checkWinner(newBoard, currentPlayer)) {
            setWinner(currentPlayer);
            handleGameEnd(currentPlayer);
            return;
        }

        if (newBoard.every((cell) => cell !== "")) {
            setWinner(null);
            handleGameEnd(null);
            return;
        }

        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }, [board, currentPlayer, winner, checkWinner, handleGameEnd]);

    const botMove = useCallback(() => {
        const bestMove = minimax(board, true).index;
        if (bestMove !== -1) {
            makeMove(bestMove);
        }
    }, [board, minimax, makeMove]);

    useEffect(() => {
        if (currentPlayer === "X" && !winner) {
            botMove();
        }
    }, [currentPlayer, winner, botMove]);

    const startGame = (playerGoesFirst: boolean) => {
        setBoard(Array(9).fill(""));
        setCurrentPlayer(playerGoesFirst ? "O" : "X");
        setWinner(null);
        setGameOver(false);
        setMessage(playerGoesFirst ? "Your turn (O)" : "Bot's turn (X)");
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest mb-3">
                            Minimax Tactical AI
                        </span>
                        <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 tracking-wider mb-6">
                            TIC-TAC-TOE
                        </h2>

                        {/* Score and Streak Badges */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center mb-6">
                            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 backdrop-blur-md">
                                <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Total Points</p>
                                <p className="text-3xl font-extrabold font-gaming text-white mt-1">{gameState.currentScore}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/20 backdrop-blur-md">
                                <p className="text-xs text-pink-300 uppercase tracking-wider font-semibold">Win Streak</p>
                                <p className="text-3xl font-extrabold font-gaming text-pink-400 mt-1 flex items-center justify-center gap-1">
                                    <span>🔥</span> {gameState.currentStreak}
                                </p>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className="p-3 px-6 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-sm font-medium mb-8 text-center shadow-inner">
                            {message}
                        </div>

                        {/* First Move Selector */}
                        {!winner && board.every(cell => cell === "") && (
                            <div className="mb-8 flex flex-col items-center gap-3">
                                <span className="text-xs text-gray-400 uppercase tracking-wider">Choose who takes first move:</span>
                                <div className="flex gap-4">
                                    <button
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-gaming text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
                                        onClick={() => startGame(true)}
                                    >
                                        You First (O)
                                    </button>
                                    <button
                                        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-gaming text-sm font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all transform hover:scale-105"
                                        onClick={() => startGame(false)}
                                    >
                                        Bot First (X)
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3x3 Game Board */}
                        <div className="grid grid-cols-3 gap-3.5 p-4 rounded-2xl bg-black/60 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.15)] mb-8">
                            {board.map((cell, index) => (
                                <button
                                    key={index}
                                    className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-4xl sm:text-5xl font-gaming font-extrabold rounded-xl transition-all duration-300 ${
                                        cell === "O"
                                            ? "text-cyan-400 bg-cyan-950/30 border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                            : cell === "X"
                                            ? "text-pink-500 bg-pink-950/30 border-2 border-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                                            : "bg-gray-900/60 border border-purple-500/20 hover:border-purple-400/60 hover:bg-purple-900/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                    }`}
                                    onClick={() => makeMove(index)}
                                    disabled={!!cell || !!winner || currentPlayer === 'X'}
                                    aria-label={`Cell ${index + 1}`}
                                >
                                    {cell}
                                </button>
                            ))}
                        </div>

                        {/* Play Again Button */}
                        {gameOver && (
                            <button
                                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all"
                                onClick={() => startGame(true)}
                            >
                                Play Again
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="mt-8">
                    <Leaderboard gameId="tictactoe" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default TicTacToe;
