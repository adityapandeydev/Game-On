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

    const updateGameState = async (result: 'win' | 'draw' | 'lose') => {
        let newStreak = gameState.currentStreak;
        let newTotalScore = gameState.currentScore;

        if (result === 'win') {
            newStreak += 1;
            const scoreIncrease = calculateScoreIncrease(newStreak);
            newTotalScore += scoreIncrease;
        } else if (result === 'draw') {
            // For draw, just award 10 points without adding to total score
            newStreak = 0; // Reset streak on draw
            newTotalScore = 10; // Just award 10 points for draw
        } else {
            // Reset streak and keep current score on loss
            newStreak = 0;
        }

        setGameState(prev => ({
            currentScore: newTotalScore,
            currentStreak: newStreak,
            highestScore: Math.max(prev.highestScore, newTotalScore)
        }));

        if (!userId) return;

        try {
            await ScoreService.saveScore('tictactoe', userId, result);
            
            if (newTotalScore > gameState.highestScore) {
                try {
                    await ScoreService.updateLeaderboard('tictactoe', userId, newTotalScore);
                } catch (error) {
                    console.error('Failed to update leaderboard:', error);
                }
            }
        } catch (error) {
            console.error('Failed to save game stats:', error);
        }
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
        <div className="min-h-[calc(100vh-4rem)] py-8">
            <div className="container mx-auto px-4 max-w-4xl h-full">
                <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold text-white mb-6">Tic Tac Toe</h2>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-md text-center mb-4">
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">💯 Score</p>
                            <p className="text-2xl text-white">{gameState.currentScore}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">🔥 Streak</p>
                            <p className="text-2xl text-white">{gameState.currentStreak}</p>
                        </div>
                    </div>

                    <p className="text-lg text-gray-300 mb-4">{message}</p>

                    {!winner && board.every(cell => cell === "") && (
                        <div className="mb-6 flex flex-col items-center">
                            <div className="flex gap-4">
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => startGame(true)}
                                >
                                    You (O)
                                </button>
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => startGame(false)}
                                >
                                    Bot (X)
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {board.map((cell, index) => (
                            <button
                                key={index}
                                className={`w-20 h-20 flex items-center justify-center text-2xl font-bold bg-gray-900 border-4 ${
                                    cell ? 'border-purple-600' : 'border-gray-700'
                                } rounded-lg hover:bg-gray-800 transition-colors`}
                                onClick={() => makeMove(index)}
                                disabled={!!cell || !!winner || currentPlayer === 'X'}
                                aria-label={`Cell ${index + 1}`}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>

                    {gameOver && (
                        <div className="text-center">
                            <button
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                onClick={() => startGame(true)}
                            >
                                Play Again
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="mt-8">
                    <Leaderboard gameId="tictactoe" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default TicTacToe;
