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
    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('tictactoe', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

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
        setBoard(["", "", "", "", "", "", "", "", ""]);
        setWinner(null);
    };

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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Tic Tac Toe</h2>

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
            
            <Leaderboard gameId="tictactoe" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default TicTacToe;
