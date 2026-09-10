import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import type { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface Connect4Props {
    userId?: string;
}

const rows = 6;
const columns = 7;

const Connect4: React.FC<Connect4Props> = ({ userId }) => {
    const [board, setBoard] = useState<string[][]>(
        Array.from({ length: rows }, () => Array(columns).fill(" "))
    );
    const [currentPlayer, setCurrentPlayer] = useState<string>("R");
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const resetGame = () => {
        setBoard(Array.from({ length: rows }, () => Array(columns).fill(" ")));
        setCurrentPlayer("R");
        setGameOver(false);
        setWinner(null);
    };

    const generateCellId = (row: number, col: number): string => {
        return `cell-${row}-${col}`;
    };

    const getCellStyle = (cell: string): string => {
        if (cell === "R") return "bg-gradient-to-br from-rose-500 to-red-600 border-2 border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.8)] scale-95";
        if (cell === "Y") return "bg-gradient-to-br from-amber-400 to-yellow-500 border-2 border-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.8)] scale-95";
        return "bg-black/60 border border-indigo-500/20 hover:border-indigo-400/60 hover:bg-indigo-900/30";
    };

    const dropPiece = (col: number) => {
        if (gameOver) return;

        // Find the next available row in the column
        const nextRow = board.findIndex((row) => row[col] === " ");
        if (nextRow === -1) return; // Column is full

        // Update the board with the current player's piece
        const newBoard = [...board];
        newBoard[nextRow][col] = currentPlayer;
        setBoard(newBoard);

        // Check for a winner after the move
        if (checkWinner(nextRow, col)) {
            setWinner(currentPlayer === "R" ? "Red" : "Yellow");
            setGameOver(true);
            handleGameEnd('win');
        } else if (board.every(row => row.every(cell => cell !== " "))) {
            setGameOver(true);
            handleGameEnd('draw');
        } else {
            // Switch players
            setCurrentPlayer(currentPlayer === "R" ? "Y" : "R");
        }
    };

    const checkLine = (startRow: number, startCol: number, deltaRow: number, deltaCol: number): boolean => {
        let count = 0;
        for (let i = 0; i < 4; i++) {
            const row = startRow + deltaRow * i;
            const col = startCol + deltaCol * i;
            if (row >= 0 && row < rows && col >= 0 && col < columns && 
                board[row][col] === currentPlayer) {
                count++;
            }
        }
        return count === 4;
    };

    const checkHorizontal = (row: number, col: number): boolean => {
        for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
            if (checkLine(row, c, 0, 1)) return true;
        }
        return false;
    };

    const checkVertical = (row: number, col: number): boolean => {
        for (let r = Math.max(0, row - 3); r <= Math.min(rows - 4, row); r++) {
            if (checkLine(r, col, 1, 0)) return true;
        }
        return false;
    };

    const checkDiagonals = (row: number, col: number): boolean => {
        // Check diagonal \
        for (let r = Math.max(0, row - 3); r <= Math.min(rows - 4, row); r++) {
            for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
                if (checkLine(r, c, 1, 1)) return true;
            }
        }
        // Check diagonal /
        for (let r = Math.max(3, row); r < rows; r++) {
            for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
                if (checkLine(r, c, -1, 1)) return true;
            }
        }
        return false;
    };

    const checkWinner = (row: number, col: number): boolean => {
        return (
            checkHorizontal(row, col) ||
            checkVertical(row, col) ||
            checkDiagonals(row, col)
        );
    };

    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('connect4', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    return (
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-2xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest mb-3">
                        Tactical 4-In-A-Row
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-300 to-amber-300 tracking-wider mb-6">
                        CONNECT 4
                    </h2>

                    {/* Turn or Winner Banner */}
                    <div className="mb-6">
                        {winner ? (
                            <div className="px-6 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-gaming text-lg font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2">
                                <span>🏆</span> {winner} Player Wins!
                            </div>
                        ) : (
                            <div className={`px-6 py-2.5 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 transition-all ${
                                currentPlayer === "R"
                                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                                    : "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                            }`}>
                                <span className={`w-3 h-3 rounded-full ${currentPlayer === "R" ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-amber-400 shadow-[0_0_10px_#fbbf24]"}`} />
                                {currentPlayer === "R" ? "Red's Turn — Click a Column" : "Yellow's Turn — Click a Column"}
                            </div>
                        )}
                    </div>

                    {/* Arcade Grid Frame */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-indigo-950/40 border-2 border-indigo-500/30 shadow-[0_0_35px_rgba(99,102,241,0.25)] mb-8">
                        {board.slice().reverse().map((row, rowIndex) => (
                            <div key={generateCellId(rowIndex, -1)} className="flex justify-center">
                                {row.map((cell, colIndex) => (
                                    <button
                                        key={generateCellId(rowIndex, colIndex)}
                                        className={`
                                            w-10 h-10 sm:w-14 sm:h-14 m-1 sm:m-1.5 rounded-full
                                            transition-all duration-300 transform ${getCellStyle(cell)}
                                        `}
                                        onClick={() => dropPiece(colIndex)}
                                        disabled={gameOver}
                                        aria-label={`Column ${colIndex + 1}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Play Again Button */}
                    {gameOver && (
                        <button
                            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all"
                            onClick={resetGame}
                        >
                            Play Again
                        </button>
                    )}
                </div>

                <div className="mt-8">
                    <Leaderboard gameId="connect4" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default Connect4;
