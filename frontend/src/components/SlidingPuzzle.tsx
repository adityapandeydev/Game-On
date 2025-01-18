import React, { useState, useCallback } from 'react';
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface SlidingPuzzleProps {
    userId?: string;
}

const SlidingPuzzle: React.FC<SlidingPuzzleProps> = ({ userId }) => {
    const [tiles, setTiles] = useState<(number | null)[]>([]);
    const [moves, setMoves] = useState<number>(0);
    const [score, setScore] = useState<number>(100);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("Click 'Start Game' to begin!");
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const createGrid = useCallback(() => {
        const initialTiles = Array.from({ length: 8 }, (_, i) => i + 1);
        initialTiles.push(null as unknown as number); // Type assertion to fix the error
        setTiles(initialTiles);
        setMoves(0);
        setScore(100);
        setMessage("Click 'Start Game' to begin!");
        setIsGameActive(false);
    }, []);

    const shuffle = useCallback(() => {
        const shuffledTiles = [...tiles];
        for (let i = shuffledTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
        }
        setTiles(shuffledTiles);
        setIsGameActive(true);
        setMessage("Slide the tiles to order them from 1-8!");
    }, [tiles]);

    const handleGameEnd = useCallback(async (result: GameResult) => {
        setIsGameActive(false);
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('slidingpuzzle', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
            setMessage(result === 'win' ? "🎉 Congratulations! Play again?" : "Keep trying!");
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const moveTile = useCallback((index: number) => {
        if (!isGameActive) return;

        const emptyIndex = tiles.indexOf(null);
        const row = Math.floor(index / 3);
        const col = index % 3;
        const emptyRow = Math.floor(emptyIndex / 3);
        const emptyCol = emptyIndex % 3;

        const isAdjacent = 
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            const newTiles = [...tiles];
            [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
            setTiles(newTiles);
            setMoves(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 1));
            checkWin(newTiles);
        }
    }, [tiles, isGameActive]);

    const checkWin = useCallback((currentTiles: (number | null)[]) => {
        const isSolved = currentTiles.slice(0, -1).every((tile, i) => tile === i + 1);
        if (isSolved) {
            handleGameEnd('win');
        }
    }, [handleGameEnd]);

    React.useEffect(() => {
        createGrid();
    }, [createGrid]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Sliding Puzzle</h2>

                <div className="flex flex-col items-center gap-6 mb-6 w-full">
                    <div className="grid grid-cols-2 gap-4 w-full text-center">
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">🎯 Moves</p>
                            <p className="text-2xl text-white">{moves}</p>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-300">💯 Score</p>
                            <p className="text-2xl text-white">{score}</p>
                        </div>
                    </div>

                    <div className="w-[300px] h-[300px] bg-gray-900 p-4 rounded-lg">
                        <div className="grid grid-cols-3 gap-2 w-full h-full">
                            {tiles.map((tile, index) => (
                                <button
                                    key={index}
                                    onClick={() => moveTile(index)}
                                    className={`${
                                        tile === null 
                                            ? 'bg-gray-800' 
                                            : 'bg-purple-600 hover:bg-purple-500'
                                    } rounded-lg text-2xl font-bold text-white transition-colors
                                    flex items-center justify-center w-full h-full`}
                                    disabled={!isGameActive}
                                >
                                    {tile}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-xl text-gray-300 mb-4">{message}</p>

                {!isGameActive && (
                    <button
                        onClick={shuffle}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors mb-4"
                    >
                        Start Game
                    </button>
                )}

                <button
                    onClick={createGrid}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                >
                    Reset Game
                </button>
            </div>
            
            <Leaderboard gameId="slidingpuzzle" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default SlidingPuzzle;
