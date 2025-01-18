import React, { useState } from "react";

const rows = 6;
const columns = 7;

const Connect4: React.FC = () => {
    const [board, setBoard] = useState<string[][]>(
        Array.from({ length: rows }, () => Array(columns).fill(" "))
    );
    const [currentPlayer, setCurrentPlayer] = useState<string>("R");
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);

    const generateCellId = (row: number, col: number): string => {
        return `cell-${row}-${col}`;
    };

    const getCellStyle = (cell: string): string => {
        if (cell === "R") return "bg-red-600 border-red-700";
        if (cell === "Y") return "bg-yellow-500 border-yellow-600";
        return "bg-gray-700 border-gray-600 hover:bg-gray-600";
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
        return checkHorizontal(row, col) || 
               checkVertical(row, col) || 
               checkDiagonals(row, col);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Connect 4</h2>

                {winner ? (
                    <h3 className="text-xl font-bold text-green-400 mb-6">{winner} Wins!</h3>
                ) : (
                    <h3 className="text-xl text-gray-300 mb-6">
                        {currentPlayer === "R" ? "Red's" : "Yellow's"} turn
                    </h3>
                )}

                <div className="bg-gray-900 p-4 rounded-lg mb-6">
                    {board.map((row, rowIndex) => (
                        <div key={generateCellId(rowIndex, -1)} className="flex justify-center">
                            {row.map((cell, colIndex) => (
                                <button
                                    key={generateCellId(rowIndex, colIndex)}
                                    className={`
                                        w-12 h-12 sm:w-16 sm:h-16 m-1 rounded-full border-4
                                        transition-all duration-200 ${getCellStyle(cell)}
                                    `}
                                    onClick={() => dropPiece(colIndex)}
                                    aria-label={`Column ${colIndex + 1}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {gameOver && (
                    <button
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                        onClick={() => window.location.reload()}
                    >
                        Play Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default Connect4;
