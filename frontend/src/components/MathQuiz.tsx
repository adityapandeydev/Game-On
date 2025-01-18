import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface Difficulty {
    label: string;
    range: number;
    mistakeInterval: number;
}

const difficulties: Difficulty[] = [
    { label: "Easy", range: 20, mistakeInterval: 1 },
    { label: "Medium", range: 60, mistakeInterval: 3 },
    { label: "Hard", range: 100, mistakeInterval: 5 },
];

interface MathQuizProps {
    userId?: string;
}

const MathQuiz: React.FC<MathQuizProps> = ({ userId }) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [number1, setNumber1] = useState<number | null>(null);
    const [number2, setNumber2] = useState<number | null>(null);
    const [score, setScore] = useState<number>(20);
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Welcome to Quantum Guess! Select difficulty to start!");
    const [guess, setGuess] = useState<string>("");
    const [attempts, setAttempts] = useState<number>(0);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const generateQuestion = useCallback((currentDifficulty: Difficulty) => {
        const num1 = Math.trunc(Math.random() * currentDifficulty.range) + 1;
        const num2 = Math.trunc(Math.random() * currentDifficulty.range) + 1;
        setNumber1(num1);
        setNumber2(num2);
    }, []);

    const handleDifficultySelect = useCallback((selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setScore(20);
        setAttempts(0);
        generateQuestion(selectedDifficulty);
        setMessage("Start solving...");
    }, [generateQuestion]);

    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('mathquiz', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const handleCheck = useCallback(() => {
        if (!difficulty || number1 === null || number2 === null) return;

        const guessNumber = Number(guess);
        if (!guess) {
            setMessage("⛔ Enter a number!");
            return;
        }

        setAttempts(prev => prev + 1);

        if (guessNumber === number1 + number2) {
            setMessage("🎉 Correct Answer!");
            if (score > highScore) {
                setHighScore(score);
            }
            handleGameEnd('win');
            return;
        }

        setMessage("❌ Incorrect! Try again.");

        if (attempts % difficulty.mistakeInterval === 0 && score > 1) {
            setScore(prev => prev - 1);
        } else if (score === 1) {
            setScore(0);
            setMessage("😂 You Lost!");
            handleGameEnd('lose');
        }
    }, [difficulty, number1, number2, guess, attempts, score, highScore, handleGameEnd]);

    const handleAgain = useCallback(() => {
        if (!difficulty) return;

        setScore(20);
        setAttempts(0);
        generateQuestion(difficulty);
        setMessage("Start solving...");
        setGuess("");
        setRefreshLeaderboard(prev => prev + 1);
    }, [difficulty, generateQuestion]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Quantum Guess</h2>

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
                        <p className="text-lg text-gray-300 mb-6">
                            (Solve the sum of {number1} + {number2})
                        </p>

                        <div className="flex flex-col items-center gap-6 mb-6">
                            <div className="w-20 h-20 flex items-center justify-center text-4xl font-bold bg-gray-900 border-4 border-purple-600 rounded-lg">
                                ?
                            </div>

                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                                    className="w-24 px-4 py-2 bg-gray-900 text-white border-4 border-purple-600 rounded-lg text-center text-xl"
                                    placeholder="#"
                                />
                                <button
                                    onClick={handleCheck}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                                >
                                    Check!
                                </button>
                            </div>
                        </div>

                        <p className="text-xl text-gray-300 mb-6">{message}</p>

                        <div className="flex flex-col items-center gap-3">
                            <p className="text-lg text-gray-300">💯 Score: {score}</p>
                            <p className="text-lg text-gray-300">🥇 Highscore: {highScore}</p>
                        </div>

                        {(score === 0 || message === "🎉 Correct Answer!") && (
                            <button
                                onClick={handleAgain}
                                className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                            >
                                Play Again
                            </button>
                        )}
                    </>
                )}
            </div>
            
            <Leaderboard gameId="mathquiz" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default MathQuiz;
