import React, { useState, useEffect } from "react";

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<string[]>(["", "", "", "", "", "", "", "", ""]);
    const [currentPlayer, setCurrentPlayer] = useState<string>("O"); // Default to "O"
    const [mode, setMode] = useState<string>(""); // "vsBot" or "1v1"
    const [winner, setWinner] = useState<string | null>(null);

    useEffect(() => {
        // Bot makes the move after the player in "vsBot" mode
        if (mode === "vsBot" && currentPlayer === "X" && !winner) {
            botMove();
        }
    }, [currentPlayer, mode, winner]);

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

    const makeMove = (position: number) => {
        if (board[position] !== "" || winner) return;

        const newBoard = [...board];
        newBoard[position] = currentPlayer;
        setBoard(newBoard);

        if (checkWinner(newBoard, currentPlayer)) {
            setWinner(`${currentPlayer} wins!`);
            return;
        }

        if (newBoard.every((cell) => cell !== "")) {
            setWinner("Draw!");
            return;
        }

        setCurrentPlayer(currentPlayer === "X" ? "O" : "X"); // Switch players for 1v1 mode
    };

    const botMove = () => {
        let bestMove = minimax(board, true).index;
        makeMove(bestMove);
    };

    const minimax = (newBoard: string[], isMaximizing: boolean) => {
        let emptyCells = newBoard
            .map((cell, index) => (cell === "" ? index : null))
            .filter((cell) => cell !== null);

        if (checkWinner(newBoard, "X")) {
            return { score: 10, index: -1 }; // Bot wins
        } else if (checkWinner(newBoard, "O")) {
            return { score: -10, index: -1 }; // Player wins
        } else if (emptyCells.length === 0) {
            return { score: 0, index: -1 }; // Draw
        }

        let moves: { index: number; score: number }[] = [];
        for (let i of emptyCells) {
            let move = { index: i, score: 0 };
            newBoard[i] = isMaximizing ? "X" : "O";

            let result = minimax(newBoard, !isMaximizing);
            move.score = result.score;

            newBoard[i] = ""; // Undo the move
            moves.push(move);
        }

        if (isMaximizing) {
            return moves.reduce((best, move) => (move.score > best.score ? move : best), { score: -Infinity, index: -1 });
        } else {
            return moves.reduce((best, move) => (move.score < best.score ? move : best), { score: Infinity, index: -1 });
        }
    };


    const checkWinner = (boardState: string[], mark: string): boolean => {
        const winPatterns = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        return winPatterns.some((pattern) => pattern.every((index) => boardState[index] === mark));
    };

    const resetGame = () => {
        setBoard(["", "", "", "", "", "", "", "", ""]);
        setCurrentPlayer("O");
        setMode("");
        setWinner(null);
    };

    return (
        <div className="flex flex-col items-center p-4 bg-gray-800 rounded-xl text-white w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Tic Tac Toe</h2>

            {!mode && (
                <div className="mb-4">
                    <p>Choose your mode:</p>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500"
                        onClick={() => selectMode("vsBot")}
                    >
                        VS Bot
                    </button>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500 ml-2"
                        onClick={() => selectMode("1v1")}
                    >
                        1v1
                    </button>
                </div>
            )}

            {mode === "vsBot" && !winner && (
                <div className="mb-4">
                    <p>Do you want to go first?</p>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500"
                        onClick={() => startGame(true)}
                    >
                        Yes
                    </button>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500 ml-2"
                        onClick={() => startGame(false)}
                    >
                        No
                    </button>
                </div>
            )}

            {mode === "1v1" && !winner && (
                <div className="mb-4">
                    <p>Player X or Player O?</p>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500"
                        onClick={() => start1v1("X")}
                    >
                        Player X
                    </button>
                    <button
                        className="p-2 bg-purple-600 rounded hover:bg-purple-500 ml-2"
                        onClick={() => start1v1("O")}
                    >
                        Player O
                    </button>
                </div>
            )}

            {mode && !winner && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {board.map((cell, index) => (
                        <div
                            key={index}
                            className="w-16 h-16 flex items-center justify-center text-xl bg-gray-900 border-2 border-pink-600 cursor-pointer hover:bg-gray-700"
                            onClick={() => makeMove(index)}
                        >
                            {cell}
                        </div>
                    ))}
                </div>
            )}

            {winner && <p className="text-xl font-bold mb-4">{winner}</p>}

            <button
                className="p-2 bg-pink-600 rounded hover:bg-pink-500 mt-4"
                onClick={resetGame}
            >
                New Game
            </button>
        </div>
    );
};

export default TicTacToe;
