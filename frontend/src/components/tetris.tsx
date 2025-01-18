import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface TetrisProps {
    userId?: string;
}

interface GameState {
    grid: number;
    playfield: string[][];
    tetromino: {
        name: string;
        matrix: number[][];
        row: number;
        col: number;
    };
    score: number;
    streak: number;
    gameOver: boolean;
}

interface GameControls {
    handleKeyDown: (e: KeyboardEvent) => void;
}

interface GameRenderer {
    gameLoop: () => void;
}

const tetrominos = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]],
    'O': [[1,1], [1,1]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]],
    'T': [[0,1,0], [1,1,1], [0,0,0]]
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextTetromino() {
    const names = Object.keys(tetrominos);
    const name = names[getRandomInt(0, names.length - 1)];
    const matrix = tetrominos[name as keyof typeof tetrominos];
    
    return {
        name,
        matrix,
        row: name === 'I' ? -1 : -2,
        col: 5 - Math.ceil(matrix[0].length / 2)
    };
}

function checkCollision(tetromino: GameState['tetromino'], playfield: string[][]): boolean {
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col] && 
                (tetromino.col + col < 0 || 
                tetromino.col + col >= playfield[0].length ||
                tetromino.row + row >= playfield.length ||
                playfield[tetromino.row + row]?.[tetromino.col + col])
            ) {
                return true;
            }
        }
    }
    return false;
}

const Tetris: React.FC<TetrisProps> = ({ userId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

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

        const gameState = initializeGameState(canvas);
        const controls = createGameControls(gameState);
        const renderer = createGameRenderer(context, gameState, handleGameEnd);
        
        document.addEventListener('keydown', controls.handleKeyDown);
        renderer.gameLoop();

        return () => {
            document.removeEventListener('keydown', controls.handleKeyDown);
        };
    }, [handleGameEnd]);

    // Initialize game on component mount
    useEffect(() => {
        if (!isPlaying) return;
        return initGame();
    }, [handleGameEnd, initGame, isPlaying]);

    const startNewGame = useCallback(() => {
        setGameOver(false);
        setScore(0);
        setStreak(0);
        setIsPlaying(true);
        const cleanup = initGame();
        return () => {
            if (cleanup) cleanup();
        };
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

                {(!isPlaying || gameOver) && (
                    <button
                        onClick={startNewGame}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors mt-2"
                    >
                        {gameOver ? 'Play Again' : 'Start Game'}
                    </button>
                )}
            </div>
            
            <Leaderboard gameId="tetris" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

// Helper functions moved outside component
function initializeGameState(canvas: HTMLCanvasElement): GameState {
    canvas.width = 200;
    canvas.height = 400;
    return {
        grid: 20,
        playfield: Array(20).fill(0).map(() => Array(10).fill(0)),
        tetromino: getNextTetromino(),
        score: 0,
        streak: 0,
        gameOver: false
    };
}

function createGameControls(gameState: GameState): GameControls {
    return {
        handleKeyDown: (e: KeyboardEvent) => {
            if (gameState.gameOver) return;

            const tetromino = gameState.tetromino;
            
            switch (e.key) {
                case 'ArrowLeft':
                    tetromino.col--;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.col++;
                    }
                    break;
                case 'ArrowRight':
                    tetromino.col++;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.col--;
                    }
                    break;
                case 'ArrowDown':
                    tetromino.row++;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.row--;
                    }
                    break;
                case 'ArrowUp': {
                    const matrix = tetromino.matrix;
                    const N = matrix.length - 1;
                    const rotated = matrix.map((row, i) => 
                        row.map((_val, j) => matrix[N - j][i])
                    );
                    tetromino.matrix = rotated;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.matrix = matrix; // Revert if invalid
                    }
                    break;
                }
            }
        }
    };
}

function createGameRenderer(context: CanvasRenderingContext2D, gameState: GameState, onGameOver: (result: GameResult) => void): GameRenderer {
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
    let animationFrameId: number;

    function drawPlayfield() {
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (gameState.playfield[row][col]) {
                    const name = gameState.playfield[row][col];
                    context.fillStyle = colors[name as keyof typeof colors];
                    context.fillRect(col * gameState.grid, row * gameState.grid, gameState.grid - 1, gameState.grid - 1);
                }
            }
        }
    }

    function drawTetromino() {
        const tetromino = gameState.tetromino;
        context.fillStyle = colors[tetromino.name as keyof typeof colors];
        
        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    context.fillRect(
                        (tetromino.col + col) * gameState.grid,
                        (tetromino.row + row) * gameState.grid,
                        gameState.grid - 1,
                        gameState.grid - 1
                    );
                }
            }
        }
    }

    function updateTetrominoPosition() {
        if (++count > 35) {
            const tetromino = gameState.tetromino;
            tetromino.row++;
            count = 0;

            if (checkCollision(tetromino, gameState.playfield)) {
                tetromino.row--;
                placeTetromino();
            }
        }
    }

    function drawGameOver() {
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('GAME OVER!', context.canvas.width / 2, context.canvas.height / 2);
    }

    function gameLoop() {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        drawPlayfield();
        drawTetromino();
        
        if (gameState.gameOver) {
            drawGameOver();
            cancelAnimationFrame(animationFrameId);
            return;
        }

        updateTetrominoPosition();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function placeTetromino() {
        const tetromino = gameState.tetromino;
        
        // Check if game is over (piece at top)
        if (tetromino.row < 0) {
            gameState.gameOver = true;
            onGameOver('lose');
            drawGameOver();
            return;
        }

        // Place the piece
        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {
                    gameState.playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
                }
            }
        }

        // Get next piece and check if it can be placed
        gameState.tetromino = getNextTetromino();
        if (checkCollision(gameState.tetromino, gameState.playfield)) {
            gameState.gameOver = true;
            onGameOver('lose');
            drawGameOver();
        }
    }

    return {
        gameLoop: () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            gameLoop();
        }
    };
}

export default Tetris;