import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import type { GameResult } from "../types/game";
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
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center text-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest mb-3">
                        Speed Computation
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-wider mb-6">
                        QUANTUM GUESS
                    </h2>

                    {!difficulty ? (
                        <div className="w-full space-y-6">
                            <p className="text-gray-300 text-sm">Select calculation complexity:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.label}
                                        onClick={() => handleDifficultySelect(diff)}
                                        className="p-5 rounded-2xl bg-black/40 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/20 hover:scale-105 transition-all text-center group"
                                    >
                                        <p className="font-gaming text-lg font-bold text-white group-hover:text-cyan-300">{diff.label}</p>
                                        <p className="text-xs text-gray-400 mt-1">Numbers: 1 – {diff.range}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-6">
                                <span>Mode: {difficulty.label}</span>
                                <button 
                                    onClick={() => setDifficulty(null)} 
                                    className="ml-1 text-gray-400 hover:text-white underline text-[11px]"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Holographic Equation Card */}
                            <div className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-purple-950/20 to-black border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-8">
                                <p className="text-xs text-cyan-300 uppercase tracking-widest font-semibold mb-2">Solve Equation</p>
                                <div className="text-4xl sm:text-5xl font-gaming font-extrabold text-white tracking-wider">
                                    <span className="text-cyan-400">{number1}</span> + <span className="text-purple-400">{number2}</span> = <span className="text-amber-300">?</span>
                                </div>
                            </div>

                            {/* Guess Form */}
                            <div className="flex items-center gap-3 mb-6 w-full max-w-xs">
                                <input
                                    type="number"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                                    className="w-full px-4 py-3 bg-black/60 text-white font-gaming text-2xl border-2 border-cyan-500/40 focus:border-cyan-400 rounded-xl text-center outline-none shadow-inner transition-colors"
                                    placeholder="Answer"
                                    disabled={score === 0 || message === "🎉 Correct Answer!"}
                                />
                                <button
                                    onClick={handleCheck}
                                    disabled={score === 0 || message === "🎉 Correct Answer!"}
                                    className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl font-gaming font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all whitespace-nowrap"
                                >
                                    Solve!
                                </button>
                            </div>

                            {/* Message */}
                            <div className="p-3 px-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-sm font-semibold mb-6 shadow-inner">
                                {message}
                            </div>

                            {/* Score Stats */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center mb-6">
                                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/20">
                                    <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Current Score</p>
                                    <p className="text-2xl font-extrabold font-gaming text-white mt-0.5">💯 {score}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20">
                                    <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">High Score</p>
                                    <p className="text-2xl font-extrabold font-gaming text-cyan-400 mt-0.5">🥇 {highScore}</p>
                                </div>
                            </div>

                            {(score === 0 || message === "🎉 Correct Answer!") && (
                                <button
                                    onClick={handleAgain}
                                    className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(168,85,247,0.5)] transform hover:scale-105 transition-all"
                                >
                                    Play Again
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="mt-8">
                    <Leaderboard gameId="mathquiz" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default MathQuiz;
