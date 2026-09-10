import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScoreService } from "../services/ScoreService";
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
    lines: number;
    gameOver: boolean;
}

const tetrominos: Record<string, number[][]> = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]],
    'O': [[1,1], [1,1]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]],
    'T': [[0,1,0], [1,1,1], [0,0,0]]
};

const colors: Record<string, string> = {
    'I': '#06b6d4', // cyan
    'O': '#facc15', // yellow
    'T': '#a855f7', // purple
    'S': '#22c55e', // green
    'Z': '#ef4444', // red
    'J': '#3b82f6', // blue
    'L': '#f97316'  // orange
};

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextTetromino() {
    const names = Object.keys(tetrominos);
    const name = names[getRandomInt(0, names.length - 1)];
    const matrix = tetrominos[name];
    
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
            if (tetromino.matrix[row][col]) {
                const newCol = tetromino.col + col;
                const newRow = tetromino.row + row;
                if (newCol < 0 || newCol >= 10 || newRow >= 20) {
                    return true;
                }
                if (newRow >= 0 && playfield[newRow]?.[newCol]) {
                    return true;
                }
            }
        }
    }
    return false;
}

const Tetris: React.FC<TetrisProps> = ({ userId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [lines, setLines] = useState<number>(0);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);

    const handleGameEnd = useCallback(async (finalScore: number) => {
        setGameOver(true);
        setIsPlaying(false);
        if (!userId) return;
        try {
            await ScoreService.saveScore('tetris', userId, finalScore);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save tetris score:', error);
        }
    }, [userId]);

    const startGame = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        cvs.width = 240;
        cvs.height = 480;
        const grid = 24;

        setScore(0);
        setStreak(0);
        setLines(0);
        setGameOver(false);
        setIsPlaying(true);

        const gameState: GameState = {
            grid,
            playfield: Array(20).fill(null).map(() => Array(10).fill('')),
            tetromino: getNextTetromino(),
            score: 0,
            streak: 0,
            lines: 0,
            gameOver: false
        };

        let dropCounter = 0;
        const dropInterval = 30; // frames per drop

        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState.gameOver) return;

            const tetromino = gameState.tetromino;
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'ArrowLeft':
                    tetromino.col--;
                    if (checkCollision(tetromino, gameState.playfield)) tetromino.col++;
                    break;
                case 'ArrowRight':
                    tetromino.col++;
                    if (checkCollision(tetromino, gameState.playfield)) tetromino.col--;
                    break;
                case 'ArrowDown':
                    tetromino.row++;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.row--;
                        placePiece();
                    }
                    break;
                case 'ArrowUp': {
                    const matrix = tetromino.matrix;
                    const N = matrix.length - 1;
                    const rotated = matrix.map((row, i) => row.map((_val, j) => matrix[N - j][i]));
                    tetromino.matrix = rotated;
                    if (checkCollision(tetromino, gameState.playfield)) {
                        tetromino.matrix = matrix; // revert
                    }
                    break;
                }
                case ' ': { // Hard drop
                    while (!checkCollision(tetromino, gameState.playfield)) {
                        tetromino.row++;
                    }
                    tetromino.row--;
                    placePiece();
                    break;
                }
            }
        };

        function placePiece() {
            const tetromino = gameState.tetromino;
            if (tetromino.row < 0) {
                endCurrentGame();
                return;
            }

            for (let r = 0; r < tetromino.matrix.length; r++) {
                for (let c = 0; c < tetromino.matrix[r].length; c++) {
                    if (tetromino.matrix[r][c]) {
                        const pr = tetromino.row + r;
                        const pc = tetromino.col + c;
                        if (pr >= 0 && pr < 20 && pc >= 0 && pc < 10) {
                            gameState.playfield[pr][pc] = tetromino.name;
                        }
                    }
                }
            }

            // Line clearing algorithm
            let clearedCount = 0;
            for (let row = 19; row >= 0; ) {
                if (gameState.playfield[row].every(cell => cell !== '')) {
                    clearedCount++;
                    for (let r = row; r > 0; r--) {
                        for (let c = 0; c < 10; c++) {
                            gameState.playfield[r][c] = gameState.playfield[r - 1][c];
                        }
                    }
                    for (let c = 0; c < 10; c++) {
                        gameState.playfield[0][c] = '';
                    }
                } else {
                    row--;
                }
            }

            if (clearedCount > 0) {
                const pointTable = [0, 100, 300, 500, 800];
                const added = pointTable[clearedCount] || (clearedCount * 200);
                gameState.score += added;
                gameState.lines += clearedCount;
                gameState.streak += clearedCount;
                setScore(gameState.score);
                setStreak(gameState.streak);
                setLines(gameState.lines);
            }

            gameState.tetromino = getNextTetromino();
            if (checkCollision(gameState.tetromino, gameState.playfield)) {
                endCurrentGame();
            }
        }

        function endCurrentGame() {
            gameState.gameOver = true;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            handleGameEnd(gameState.score);
        }

        function draw() {
            if (!ctx || !cvs) return;
            ctx.fillStyle = '#0a0b10';
            ctx.fillRect(0, 0, cvs.width, cvs.height);

            // Draw grid lines
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
            ctx.lineWidth = 1;
            for (let c = 0; c <= 10; c++) {
                ctx.beginPath();
                ctx.moveTo(c * grid, 0);
                ctx.lineTo(c * grid, cvs.height);
                ctx.stroke();
            }
            for (let r = 0; r <= 20; r++) {
                ctx.beginPath();
                ctx.moveTo(0, r * grid);
                ctx.lineTo(cvs.width, r * grid);
                ctx.stroke();
            }

            // Draw locked pieces
            for (let r = 0; r < 20; r++) {
                for (let c = 0; c < 10; c++) {
                    const block = gameState.playfield[r][c];
                    if (block) {
                        ctx.fillStyle = colors[block] || '#a855f7';
                        ctx.shadowColor = colors[block] || '#a855f7';
                        ctx.shadowBlur = 6;
                        ctx.fillRect(c * grid + 1, r * grid + 1, grid - 2, grid - 2);
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Draw active tetromino
            const t = gameState.tetromino;
            ctx.fillStyle = colors[t.name] || '#a855f7';
            ctx.shadowColor = colors[t.name] || '#a855f7';
            ctx.shadowBlur = 10;
            for (let r = 0; r < t.matrix.length; r++) {
                for (let c = 0; c < t.matrix[r].length; c++) {
                    if (t.matrix[r][c]) {
                        const px = (t.col + c) * grid;
                        const py = (t.row + r) * grid;
                        if (py >= 0) {
                            ctx.fillRect(px + 1, py + 1, grid - 2, grid - 2);
                        }
                    }
                }
            }
            ctx.shadowBlur = 0;

            if (gameState.gameOver) {
                ctx.fillStyle = 'rgba(10, 11, 16, 0.85)';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 22px Orbitron, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', cvs.width / 2, cvs.height / 2 - 10);
                ctx.fillStyle = '#e2e8f0';
                ctx.font = '14px sans-serif';
                ctx.fillText(`Score: ${gameState.score}`, cvs.width / 2, cvs.height / 2 + 20);
            }
        }

        function loop() {
            if (gameState.gameOver) return;

            if (++dropCounter > dropInterval) {
                gameState.tetromino.row++;
                dropCounter = 0;
                if (checkCollision(gameState.tetromino, gameState.playfield)) {
                    gameState.tetromino.row--;
                    placePiece();
                }
            }

            draw();
            animationFrameRef.current = requestAnimationFrame(loop);
        }

        document.addEventListener('keydown', handleKeyDown);
        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [handleGameEnd]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-8 px-4 text-white">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                {/* Header Card */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-gaming font-extrabold tracking-widest bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                        TETRIS ARCADE
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Clear rows, earn multi-line combos, and rise on the leaderboard!</p>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 w-full max-w-2xl bg-gray-900/80 backdrop-blur-xl border border-purple-500/20 p-6 rounded-3xl shadow-2xl">
                    {/* Controls & Stats */}
                    <div className="flex flex-col gap-4 w-full md:w-56">
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                            <div className="bg-gray-950/70 border border-purple-500/20 p-3 rounded-2xl text-center">
                                <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Score</span>
                                <p className="text-2xl font-gaming font-bold text-white mt-0.5">{score}</p>
                            </div>
                            <div className="bg-gray-950/70 border border-cyan-500/20 p-3 rounded-2xl text-center">
                                <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Lines</span>
                                <p className="text-2xl font-gaming font-bold text-white mt-0.5">{lines}</p>
                            </div>
                            <div className="bg-gray-950/70 border border-pink-500/20 p-3 rounded-2xl text-center col-span-2 md:col-span-1">
                                <span className="text-xs uppercase tracking-wider text-pink-400 font-semibold">Streak</span>
                                <p className="text-2xl font-gaming font-bold text-white mt-0.5">{streak}x</p>
                            </div>
                        </div>

                        {/* Controls Cheatsheet */}
                        <div className="bg-gray-950/50 border border-gray-800 p-3.5 rounded-2xl text-xs space-y-1.5 text-gray-400">
                            <p className="font-semibold text-gray-300 mb-1">🎮 Keyboard Controls:</p>
                            <p><span className="text-purple-400 font-mono">← →</span> Move Left / Right</p>
                            <p><span className="text-purple-400 font-mono">↑</span> Rotate Tetromino</p>
                            <p><span className="text-purple-400 font-mono">↓</span> Soft Drop</p>
                            <p><span className="text-purple-400 font-mono">Space</span> Instant Hard Drop</p>
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full py-3.5 rounded-2xl font-gaming font-bold tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all transform active:scale-95"
                        >
                            {isPlaying ? 'Restart Game' : gameOver ? 'Play Again' : 'Start Game'}
                        </button>
                    </div>

                    {/* Canvas Screen */}
                    <div className="relative p-3 bg-gray-950 rounded-2xl border-2 border-purple-500/40 shadow-inner">
                        <canvas
                            ref={canvasRef}
                            className="rounded-xl block bg-gray-950"
                        />
                        {!isPlaying && !gameOver && (
                            <div className="absolute inset-0 m-3 rounded-xl bg-gray-950/90 flex flex-col items-center justify-center p-6 text-center">
                                <span className="text-5xl mb-3">🕹️</span>
                                <p className="font-gaming text-lg text-white font-bold mb-2">Ready to Drop?</p>
                                <p className="text-xs text-gray-400 mb-4">Press Start Game to play Tetris.</p>
                                <button
                                    onClick={startGame}
                                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-gaming font-semibold text-sm shadow-md"
                                >
                                    Start Game
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="w-full mt-10">
                    <Leaderboard gameId="tetris" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default Tetris;