import React, { useState, useCallback, useEffect } from 'react';
import { ScoreService } from "../services/ScoreService";
import Leaderboard from './Leaderboard';

interface SlidingPuzzleProps {
    userId?: string;
}

function isSolvable(arr: (number | null)[]): boolean {
    const numbers = arr.filter((x): x is number => x !== null);
    let inversions = 0;
    for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) {
                inversions++;
            }
        }
    }
    return inversions % 2 === 0;
}

const SlidingPuzzle: React.FC<SlidingPuzzleProps> = ({ userId }) => {
    const [tiles, setTiles] = useState<(number | null)[]>([]);
    const [moves, setMoves] = useState<number>(0);
    const [score, setScore] = useState<number>(100);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [isWon, setIsWon] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("Click 'Start Game' to begin!");
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const createSolvedGrid = useCallback(() => {
        const initialTiles: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, null];
        setTiles(initialTiles);
        setMoves(0);
        setScore(100);
        setIsGameActive(false);
        setIsWon(false);
        setMessage("Click 'Start Game' to shuffle!");
    }, []);

    const shuffleSolvable = useCallback(() => {
        let shuffled: (number | null)[] = [1, 2, 3, 4, 5, 6, 7, 8, null];
        let solved = true;

        while (solved) {
            // Fisher-Yates on first 8 items, keep null at the end
            const nums = [1, 2, 3, 4, 5, 6, 7, 8];
            for (let i = nums.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [nums[i], nums[j]] = [nums[j], nums[i]];
            }
            shuffled = [...nums, null];

            // Inversion parity check for 8-puzzle
            if (!isSolvable(shuffled)) {
                // Swap first two numbers to flip parity from odd to even
                [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
            }

            // Ensure it's not already solved
            solved = shuffled.slice(0, 8).every((val, idx) => val === idx + 1);
        }

        setTiles(shuffled);
        setMoves(0);
        setScore(100);
        setIsGameActive(true);
        setIsWon(false);
        setMessage("Slide tiles to arrange numbers 1 through 8!");
    }, []);

    const handleWin = useCallback(async (finalScore: number) => {
        setIsGameActive(false);
        setIsWon(true);
        setMessage("🎉 Puzzle Solved! Magnificent work!");
        if (!userId) return;

        try {
            await ScoreService.saveScore('slidingpuzzle', userId, finalScore);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const moveTile = useCallback((index: number) => {
        if (!isGameActive) return;

        const emptyIndex = tiles.indexOf(null);
        if (emptyIndex === -1) return;

        const row = Math.floor(index / 3);
        const col = index % 3;
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;

        const isAdjacent =
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            const nextTiles = [...tiles];
            [nextTiles[index], nextTiles[emptyIndex]] = [nextTiles[emptyIndex], nextTiles[index]];
            setTiles(nextTiles);

            const newMoves = moves + 1;
            const newScore = Math.max(10, 100 - newMoves);
            setMoves(newMoves);
            setScore(newScore);

            // Check if solved
            const solved = nextTiles.slice(0, 8).every((tile, i) => tile === i + 1);
            if (solved) {
                handleWin(newScore);
            }
        }
    }, [tiles, isGameActive, moves, handleWin]);

    useEffect(() => {
        createSolvedGrid();
    }, [createSolvedGrid]);

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-10 px-4 text-white">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-gaming font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                        SLIDING PUZZLE
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Slide the numbered tiles into numerical order in fewest moves!</p>
                </div>

                <div className="flex flex-col items-center p-8 bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl max-w-md w-full">
                    {/* Stats bar */}
                    <div className="grid grid-cols-2 gap-4 w-full text-center mb-6">
                        <div className="bg-gray-950/70 border border-purple-500/20 p-3 rounded-2xl">
                            <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Moves</p>
                            <p className="text-2xl font-gaming font-bold text-white mt-0.5">{moves}</p>
                        </div>
                        <div className="bg-gray-950/70 border border-cyan-500/20 p-3 rounded-2xl">
                            <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Score</p>
                            <p className="text-2xl font-gaming font-bold text-white mt-0.5">{score}</p>
                        </div>
                    </div>

                    {/* 3x3 Grid Board */}
                    <div className="w-72 h-72 sm:w-80 sm:h-80 bg-gray-950 p-3.5 rounded-2xl border-2 border-purple-500/40 shadow-inner mb-6">
                        <div className="grid grid-cols-3 gap-2.5 w-full h-full">
                            {tiles.map((tile, index) => (
                                <button
                                    key={tile === null ? 'empty' : `tile-${tile}`}
                                    onClick={() => moveTile(index)}
                                    disabled={!isGameActive || tile === null}
                                    className={`rounded-xl text-3xl font-extrabold font-gaming transition-all duration-150 flex items-center justify-center w-full h-full ${
                                        tile === null
                                            ? 'bg-gray-900/40 border border-dashed border-gray-800'
                                            : isWon
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                                                : 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 active:scale-95'
                                    }`}
                                >
                                    {tile}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className={`text-base font-semibold mb-6 text-center ${isWon ? 'text-green-400' : 'text-gray-300'}`}>
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={shuffleSolvable}
                            className="flex-1 py-3 rounded-2xl font-gaming font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                        >
                            {isGameActive ? 'Reshuffle' : 'Start Game'}
                        </button>
                        <button
                            onClick={createSolvedGrid}
                            className="px-5 py-3 rounded-2xl font-gaming font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="w-full mt-10">
                    <Leaderboard gameId="slidingpuzzle" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default SlidingPuzzle;
