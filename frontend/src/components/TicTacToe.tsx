import React, { useState, useEffect, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface TicTacToeProps {
    userId?: string;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ userId }) => {
    const [board, setBoard] = useState<string[]>(["", "", "", "", "", "", "", "", ""]);
    const [currentPlayer, setCurrentPlayer] = useState<string>("O");
    const [mode, setMode] = useState<string>("");
    const [winner, setWinner] = useState<string | null>(null);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [message, setMessage] = useState("");
    const [playerMark, setPlayerMark] = useState<string>("");

    const handleGameEnd = useCallback(async (winner: string | null) => {
        setGameOver(true);
        let result: GameResult = 'lose';

        if (mode === 'vsBot') {
            if (winner === 'O') {
                setScore(prev => prev + 20);
                setStreak(prev => prev + 1);
                result = 'win';
                setMessage("🎉 You Win! Streak increased!");
            } else if (winner === 'X') {
                setStreak(0);
                result = 'lose';
                setMessage("❌ Bot Wins! Streak reset!");
            } else {
                setMessage("😐 It's a Draw!");
                result = 'draw';
            }
        } else {
            if (winner === playerMark) {
                setScore(prev => prev + 20);
                setStreak(prev => prev + 1);
                result = 'win';
                setMessage(`🎉 ${winner} Wins! Streak increased!`);
            } else if (winner) {
                setStreak(0);
                setMessage(`❌ ${winner} Wins! Streak reset!`);
            } else {
                setMessage("😐 It's a Draw!");
                result = 'draw';
            }
        }

        if (!userId) return;
        
        try {
            await ScoreService.saveScore('tictactoe', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId, mode, playerMark]);

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
            setWinner(`${currentPlayer} wins!`);
            handleGameEnd('win');
            return;
        }

        if (newBoard.every((cell) => cell !== "")) {
            setWinner("Draw!");
            handleGameEnd('draw');
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
        if (mode === "vsBot" && currentPlayer === "X" && !winner) {
            botMove();
        }
    }, [currentPlayer, mode, winner, botMove]);

    const selectMode = (selectedMode: string) => {
        setMode(selectedMode);
        setBoard(Array(9).fill(""));
        setWinner(null);
        setGameOver(false);
        if (selectedMode === 'vsBot') {
            setPlayerMark('O');
        }
        setMessage(selectedMode === 'vsBot' ? "Choose who goes first!" : "Choose your mark (X or O)!");
    };

    const chooseMark = (mark: string) => {
        setPlayerMark(mark);
        setCurrentPlayer('O');
        setMessage(`You are ${mark}. Game started!`);
    };

    const renderMarkSelection = () => (
        <div className="text-center mb-4">
            <p className="text-lg text-gray-300 mb-2">Choose your mark:</p>
            <div className="flex gap-4 justify-center">
                <button
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                    onClick={() => chooseMark('O')}
                >
                    O
                </button>
                <button
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
                    onClick={() => chooseMark('X')}
                >
                    X
                </button>
            </div>
        </div>
    );

    const startGame = (playerGoesFirst: boolean) => {
        setCurrentPlayer(playerGoesFirst ? "O" : "X");
        setWinner(null);
    };

    const start1v1 = (playerSelected: string) => {
        setCurrentPlayer(playerSelected);
        setWinner(null);
    };

    const resetGame = () => {
        setBoard(["", "", "", "", "", "", "", "", ""]);
        setCurrentPlayer("O");
        setMode("");
        setWinner(null);
        setRefreshLeaderboard(prev => prev + 1);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8">
            <div className="container mx-auto px-4 max-w-4xl h-full">
                <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold text-white mb-6">Tic Tac Toe</h2>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-md text-center mb-4">
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">💯 Score</p>
                            <p className="text-2xl text-white">{score}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">🔥 Streak</p>
                            <p className="text-2xl text-white">{streak}</p>
                        </div>
                    </div>

                    <p className="text-lg text-gray-300 mb-4">{message}</p>

                    {!mode && (
                        <div className="mb-6 flex flex-col items-center">
                            <p className="text-lg text-gray-300 mb-4">Choose your mode:</p>
                            <div className="flex gap-4">
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => selectMode("vsBot")}
                                >
                                    VS Bot
                                </button>
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => selectMode("1v1")}
                                >
                                    1v1
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === "vsBot" && !winner && board.every(cell => cell === "") && (
                        <div className="mb-6 flex flex-col items-center">
                            <p className="text-lg text-gray-300 mb-4">Who plays first?</p>
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

                    {mode === "1v1" && !winner && board.every(cell => cell === "") && (
                        <div className="mb-6 flex flex-col items-center">
                            <p className="text-lg text-gray-300 mb-4">Choose your mark:</p>
                            <div className="flex gap-4">
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => start1v1("X")}
                                >
                                    Player X
                                </button>
                                <button
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    onClick={() => start1v1("O")}
                                >
                                    Player O
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === '1v1' && !playerMark && renderMarkSelection()}

                    {mode && !winner && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {board.map((cell, index) => (
                                <button
                                    key={`cell-${Math.floor(index/3)}-${index%3}`}
                                    className={`w-20 h-20 flex items-center justify-center text-2xl font-bold bg-gray-900 border-4 ${
                                        cell ? 'border-purple-600' : 'border-gray-700'
                                    } rounded-lg hover:bg-gray-800 transition-colors`}
                                    onClick={() => makeMove(index)}
                                    disabled={!!cell || !!winner}
                                    aria-label={`Cell ${index + 1}`}
                                >
                                    {cell}
                                </button>
                            ))}
                        </div>
                    )}

                    {winner && (
                        <div className="text-center">
                            <p className="text-xl font-bold text-green-400 mb-4">{winner}</p>
                            <button
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                onClick={resetGame}
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
