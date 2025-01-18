import React, { useState, useEffect, useCallback } from 'react';
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface Difficulty {
    label: string;
    timeLimit: number;
    range: number;
}

const difficulties: Difficulty[] = [
    { label: "Easy", timeLimit: 30, range: 20 },
    { label: "Medium", timeLimit: 45, range: 50 },
    { label: "Hard", timeLimit: 60, range: 100 },
];

interface ChallengeProps {
    userId?: string;
}

const Challenge: React.FC<ChallengeProps> = ({ userId }) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [isGameReady, setIsGameReady] = useState<boolean>(false);
    const [score, setScore] = useState<number>(100);
    const [highScore, setHighScore] = useState<number>(0);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);
    const [currentNumber, setCurrentNumber] = useState<number>(0);
    const [moves, setMoves] = useState<Array<{ operation: string; value: number }>>([]);
    const [result, setResult] = useState<number>(0);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [message, setMessage] = useState<string>("Select difficulty to start!");

    const generateChallenge = useCallback((diff: Difficulty) => {
        const startNum = Math.floor(Math.random() * diff.range) + 1;
        const numMoves = Math.floor(Math.random() * 3) + 2; // 2-4 moves
        const operations = ['+', '-', '*'];
        const newMoves = [];
        let currentResult = startNum;

        for (let i = 0; i < numMoves; i++) {
            const operation = operations[Math.floor(Math.random() * operations.length)];
            const value = Math.floor(Math.random() * 10) + 1;
            newMoves.push({ operation, value });
            
            switch (operation) {
                case '+': currentResult += value; break;
                case '-': currentResult -= value; break;
                case '*': currentResult *= value; break;
            }
        }

        setCurrentNumber(startNum);
        setMoves(newMoves);
        setResult(currentResult);
        return newMoves;
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isGameActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleGameEnd('lose');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isGameActive, timeLeft]);

    const handleDifficultySelect = useCallback((selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setTimeLeft(selectedDifficulty.timeLimit);
        setIsGameReady(true);
        setIsGameActive(false);
        setScore(100);
        generateChallenge(selectedDifficulty);
        setMessage("Click 'Start Challenge' when you're ready!");
        setUserAnswer('');
    }, [generateChallenge]);

    const handleStartGame = useCallback(() => {
        setIsGameActive(true);
        setMessage("Solve the challenge!");
    }, []);

    const handleGameEnd = useCallback(async (result: GameResult) => {
        setIsGameActive(false);
        setIsGameReady(false);
        if (!userId) return;
        
        try {
            if (result === 'win' && score > highScore) {
                setHighScore(score);
            }
            await ScoreService.saveScore('mathchallenge', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
            setMessage(result === 'win' ? "🎉 Correct! Try another challenge?" : "⏰ Time's up!");
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId, score, highScore]);

    const handleSubmit = useCallback(() => {
        if (!userAnswer) return;
        
        const userResult = parseInt(userAnswer);
        if (userResult === result) {
            handleGameEnd('win');
        } else {
            setScore(prev => Math.max(0, prev - 10));
            setMessage("❌ Wrong answer! Try again!");
            setUserAnswer('');
        }
    }, [userAnswer, result, handleGameEnd]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Math Challenge</h2>

                {!difficulty ? (
                    <div className="mb-6 flex flex-col items-center">
                        <p className="text-lg text-gray-300 mb-4">Select Difficulty</p>
                        <div className="flex gap-4">
                            {difficulties.map((diff) => (
                                <button
                                    key={diff.label}
                                    onClick={() => handleDifficultySelect(diff)}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                >
                                    {diff.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-6 mb-6 w-full">
                            <div className="grid grid-cols-2 gap-4 w-full text-center">
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-gray-300">⏳ Time Left</p>
                                    <p className="text-2xl text-white">{timeLeft}s</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-gray-300">💯 Score</p>
                                    <p className="text-2xl text-white">{score}</p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-900 p-4 rounded-lg">
                                <div className="flex items-center justify-center gap-4 text-2xl text-gray-300">
                                    <span>{currentNumber}</span>
                                    {moves.map((move, index) => (
                                        <React.Fragment key={index}>
                                            <span className="text-purple-400">{move.operation}</span>
                                            <span>{move.value}</span>
                                        </React.Fragment>
                                    ))}
                                    <span className="text-purple-400">=</span>
                                    <span>?</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="px-4 py-2 bg-gray-900 text-white border-4 border-purple-600 rounded-lg text-xl w-32 text-center"
                                    placeholder="#"
                                    disabled={!isGameActive}
                                />
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                    disabled={!isGameActive || !userAnswer}
                                >
                                    Check!
                                </button>
                            </div>
                        </div>

                        <p className="text-xl text-gray-300 mb-4">{message}</p>

                        {isGameReady && !isGameActive && (
                            <button
                                onClick={handleStartGame}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors mb-4"
                            >
                                Start Challenge
                            </button>
                        )}

                        {(!isGameReady || !isGameActive) && (
                            <button
                                onClick={() => setDifficulty(null)}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                            >
                                Change Difficulty
                            </button>
                        )}
                    </>
                )}
            </div>
            
            <Leaderboard gameId="mathchallenge" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default Challenge;
