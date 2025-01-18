import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface TetrisProps {
    userId?: string;
}

const Tetris: React.FC<TetrisProps> = ({ userId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const gameStateRef = useRef<{ rAF: number | null }>({ rAF: null });

    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        try {
            await ScoreService.saveScore('tetris', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const initGame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const grid = 20;
        canvas.width = 200;
        canvas.height = 400;

        const tetrominoSequence: string[] = [];

        // Initialize the playfield
        const playfield = Array(20).fill(0).map(() => Array(10).fill(0));

        const tetrominos = {
            'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            'J': [[1,0,0], [1,1,1], [0,0,0]],
            'L': [[0,0,1], [1,1,1], [0,0,0]],
            'O': [[1,1], [1,1]],
            'S': [[0,1,1], [1,1,0], [0,0,0]],
            'Z': [[1,1,0], [0,1,1], [0,0,0]],
            'T': [[0,1,0], [1,1,1], [0,0,0]]
        };

        const colors = {
            'I': '#0DC2FF',
            'O': '#FFD300',
            'T': '#9013FE',
            'S': '#38E54D',
            'Z': '#FF2442',
            'J': '#0096FF',
            'L': '#FF8B13'
        };

        let count = 0;
        let tetromino = getNextTetromino();
        let rAF = requestAnimationFrame(gameLoop);
        let gameOverState = false;

        function getRandomInt(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function generateSequence() {
            const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
            while (sequence.length) {
                const rand = getRandomInt(0, sequence.length - 1);
                const name = sequence.splice(rand, 1)[0];
                tetrominoSequence.push(name);
            }
        }

        function getNextTetromino() {
            if (tetrominoSequence.length === 0) {
                generateSequence();
            }
            const name = tetrominoSequence.pop() || 'I';
            const matrix = tetrominos[name as keyof typeof tetrominos];
            const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
            const row = name === 'I' ? -1 : -2;

            return {
                name,
                matrix,
                row,
                col
            };
        }

        function rotate(matrix: number[][]) {
            const N = matrix.length - 1;
            const result = matrix.map((row, i) =>
                row.map((val, j) => matrix[N - j][i])
            );
            return result;
        }

        function isValidMove(matrix: number[][], cellRow: number, cellCol: number) {
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    if (matrix[row][col] && (
                        cellCol + col < 0 ||
                        cellCol + col >= playfield[0].length ||
                        cellRow + row >= playfield.length ||
                        playfield[cellRow + row]?.[cellCol + col])
                    ) {
                        return false;
                    }
                }
            }
            return true;
        }

        function placeTetromino() {
            for (let row = 0; row < tetromino.matrix.length; row++) {
                for (let col = 0; col < tetromino.matrix[row].length; col++) {
                    if (tetromino.matrix[row][col]) {
                        if (tetromino.row + row < 0) {
                            return showGameOver();
                        }
                        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
                    }
                }
            }

            // Simplified scoring - just count consecutive line clears
            let linesCleared = 0;
            for (let row = playfield.length - 1; row >= 0; ) {
                if (playfield[row].every(cell => !!cell)) {
                    linesCleared++;
                    for (let r = row; r >= 0; r--) {
                        playfield[r] = playfield[r - 1] || Array(10).fill(0);
                    }
                } else {
                    row--;
                }
            }

            if (linesCleared > 0) {
                setScore(prev => prev + (linesCleared * 100));
                setStreak(prev => prev + 1);
            } else {
                setStreak(0);
            }

            tetromino = getNextTetromino();
        }

        function showGameOver() {
            if (gameStateRef.current.rAF) {
                cancelAnimationFrame(gameStateRef.current.rAF);
            }
            gameOverState = true;
            setGameOver(true);
            handleGameEnd('lose');
            
            context.fillStyle = 'rgba(0, 0, 0, 0.75)';
            context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
            
            context.fillStyle = 'white';
            context.font = '36px monospace';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
        }

        function gameLoop() {
            gameStateRef.current.rAF = requestAnimationFrame(gameLoop);
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw playfield
            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < 10; col++) {
                    if (playfield[row][col]) {
                        const name = playfield[row][col];
                        context.fillStyle = colors[name as keyof typeof colors];
                        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
                    }
                }
            }

            // Draw tetromino with slower speed (increased from 35 to 50)
            if (tetromino) {
                if (++count > 50) {
                    tetromino.row++;
                    count = 0;
                    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                        tetromino.row--;
                        placeTetromino();
                    }
                }

                context.fillStyle = colors[tetromino.name as keyof typeof colors];
                for (let row = 0; row < tetromino.matrix.length; row++) {
                    for (let col = 0; col < tetromino.matrix[row].length; col++) {
                        if (tetromino.matrix[row][col]) {
                            context.fillRect((tetromino.col + col) * grid,
                                          (tetromino.row + row) * grid,
                                          grid - 1,
                                          grid - 1);
                        }
                    }
                }
            }
        }

        // Keyboard controls
        function handleKeyDown(e: KeyboardEvent) {
            if (gameOverState) return;

            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const col = e.key === 'ArrowLeft'
                    ? tetromino.col - 1
                    : tetromino.col + 1;

                if (isValidMove(tetromino.matrix, tetromino.row, col)) {
                    tetromino.col = col;
                }
            }

            if (e.key === 'ArrowUp') {
                const matrix = rotate(tetromino.matrix);
                if (isValidMove(matrix, tetromino.row, tetromino.col)) {
                    tetromino.matrix = matrix;
                }
            }

            if (e.key === 'ArrowDown') {
                const row = tetromino.row + 1;
                if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
                    tetromino.row = row - 1;
                    placeTetromino();
                    return;
                }
                tetromino.row = row;
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        // Start the game loop
        gameStateRef.current.rAF = requestAnimationFrame(gameLoop);

        // Cleanup function
        return () => {
            if (gameStateRef.current.rAF) {
                cancelAnimationFrame(gameStateRef.current.rAF);
            }
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleGameEnd]);

    // Initialize game on component mount
    useEffect(() => {
        return initGame();
    }, [initGame]);

    const startNewGame = useCallback(() => {
        if (gameStateRef.current.rAF) {
            cancelAnimationFrame(gameStateRef.current.rAF);
        }
        setGameOver(false);
        setScore(0);
        setStreak(0);
        initGame();
    }, [initGame]);

    return (
        <div className="container mx-auto px-4 py-2 max-w-2xl">
            <div className="flex flex-col items-center p-3 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">Tetris</h2>

                <div className="flex flex-row items-start gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <div className="bg-gray-700 p-2 rounded-lg text-center">
                            <p className="text-gray-300 text-sm">💯 Score</p>
                            <p className="text-xl text-white">{score}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded-lg text-center">
                            <p className="text-gray-300 text-sm">🔥 Streak</p>
                            <p className="text-xl text-white">{streak}</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 p-2 rounded-lg">
                        <canvas
                            ref={canvasRef}
                            className="border border-gray-700 rounded-lg"
                        />
                    </div>
                </div>

                {gameOver && (
                    <button
                        onClick={startNewGame}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors mt-2"
                    >
                        Start New Game
                    </button>
                )}
            </div>
            
            <Leaderboard gameId="tetris" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default Tetris;