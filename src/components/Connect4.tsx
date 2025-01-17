import React, { useState, useEffect } from "react";

const rows = 6;
const columns = 7;

const Connect4: React.FC = () => {
    const [board, setBoard] = useState<string[][]>(
        Array.from({ length: rows }, () => Array(columns).fill(" "))
    );
    const [currentPlayer, setCurrentPlayer] = useState<string>("R");
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<string | null>(null);

    // This useEffect is added to log and check the board on state change
    useEffect(() => {
        console.log("Board State Updated: ", board);
    }, [board]);

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

    const checkWinner = (row: number, col: number): boolean => {
        // Horizontal
        for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
            if (
                board[row][c] === currentPlayer &&
                board[row][c + 1] === currentPlayer &&
                board[row][c + 2] === currentPlayer &&
                board[row][c + 3] === currentPlayer
            ) {
                return true;
            }
        }

        // Vertical
        for (let r = Math.max(0, row - 3); r <= Math.min(rows - 4, row); r++) {
            if (
                board[r][col] === currentPlayer &&
                board[r + 1][col] === currentPlayer &&
                board[r + 2][col] === currentPlayer &&
                board[r + 3][col] === currentPlayer
            ) {
                return true;
            }
        }

        // Diagonal (bottom-left to top-right)
        for (let r = Math.max(0, row - 3); r <= Math.min(rows - 4, row); r++) {
            for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
                if (
                    board[r][c] === currentPlayer &&
                    board[r + 1][c + 1] === currentPlayer &&
                    board[r + 2][c + 2] === currentPlayer &&
                    board[r + 3][c + 3] === currentPlayer
                ) {
                    return true;
                }
            }
        }

        // Diagonal (top-left to bottom-right)
        for (let r = Math.max(3, row); r < rows; r++) {
            for (let c = Math.max(0, col - 3); c <= Math.min(columns - 4, col); c++) {
                if (
                    board[r][c] === currentPlayer &&
                    board[r - 1][c + 1] === currentPlayer &&
                    board[r - 2][c + 2] === currentPlayer &&
                    board[r - 3][c + 3] === currentPlayer
                ) {
                    return true;
                }
            }
        }

        return false;
    };

    const renderBoard = () => {
        return (
            <div className="flex flex-col items-center mt-4">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center">
                        {row.map((cell, colIndex) => (
                            <div
                                key={colIndex}
                                className={`w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 m-0.5 xs:m-1 rounded-full border-4 cursor-pointer transition-all ${
                                    cell === "R" ? "bg-red-600" : cell === "Y" ? "bg-yellow-500" : "bg-white"
                                } hover:bg-opacity-80`}
                                onClick={() => dropPiece(colIndex)}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center p-3 xs:p-4 bg-gray-800 rounded-lg shadow-xl w-full max-w-full xs:max-w-full sm:max-w-full">
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-white mb-3 xs:mb-4">Connect 4</h2>
            {winner ? (
                <h3 className="text-lg xs:text-xl sm:text-2xl text-green-500 mb-3 xs:mb-4">{winner} Wins!</h3>
            ) : (
                <h3 className="ext-base xs:text-lg sm:text-xl text-white mb-3 xs:mb-4">{currentPlayer === "R" ? "Red's" : "Yellow's"} turn</h3>
            )}
            {renderBoard()}
            {gameOver && (
                <button
                    className="mt-3 xs:mt-4 p-1 xs:p-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    onClick={() => window.location.reload()}
                >
                    Play Again
                </button>
            )}
        </div>
    );
};

export default Connect4;
