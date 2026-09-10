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

interface GuessMyNumberProps {
    userId?: string;
}

const GuessMyNumber: React.FC<GuessMyNumberProps> = ({ userId }) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [number, setNumber] = useState<number | null>(null);
    const [score, setScore] = useState<number>(20);
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Start guessing...");
    const [guess, setGuess] = useState<string>("");
    const [attempts, setAttempts] = useState<number>(0);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const getHint = useCallback((guessNumber: number, currentDifficulty: Difficulty, targetNumber: number): string => {
        const difference = Math.abs(guessNumber - targetNumber);
        const rangePercentage = difference / currentDifficulty.range;

        switch (currentDifficulty.label) {
            case "Easy":
                return guessNumber < targetNumber ? "📉 Too Small!" : "📈 Too Big!";
            case "Medium":
                if (guessNumber < targetNumber) return "📉 Too Small!";
                return rangePercentage < 0.5 ? "📊 Big!" : "📈 Too Big!";
            case "Hard":
                if (guessNumber < targetNumber) {
                    return rangePercentage < 0.5 ? "📊 Small!" : "📈 Too Small!";
                }
                return rangePercentage < 0.5 ? "📊 Big!" : "📈 Too Big!";
            default:
                return "";
        }
    }, []);

    const handleDifficultySelect = useCallback((selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setScore(20);
        setAttempts(0);
        setNumber(Math.trunc(Math.random() * selectedDifficulty.range) + 1);
        setMessage("Start guessing...");
    }, []);

    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('guessmynumber', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const handleCheck = useCallback(() => {
        if (!difficulty || !number) return;

        const guessNumber = Number(guess);
        if (!guess) {
            setMessage("⛔ Enter a number!");
            return;
        }

        setAttempts(prev => prev + 1);

        if (guessNumber === number) {
            setMessage("🎉 Correct Number!");
            if (score > highScore) {
                setHighScore(score);
            }
            handleGameEnd('win');
            return;
        }

        const hintMessage = getHint(guessNumber, difficulty, number);
        setMessage(hintMessage);

        if (attempts % difficulty.mistakeInterval === 0 && score > 1) {
            setScore(prev => prev - 1);
        } else if (score === 1) {
            setScore(0);
            setMessage("😂 You Lost!");
            handleGameEnd('lose');
        }
    }, [difficulty, number, guess, attempts, score, highScore, getHint, handleGameEnd]);

    const handleAgain = useCallback(() => {
        if (!difficulty) return;

        setScore(20);
        setAttempts(0);
        setNumber(Math.trunc(Math.random() * difficulty.range) + 1);
        setMessage("Start guessing...");
        setGuess("");
        setRefreshLeaderboard(prev => prev + 1);
    }, [difficulty]);

    return (
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center text-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest mb-3">
                        Deductive Logic
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 tracking-wider mb-6">
                        GUESS MY NUMBER
                    </h2>

                    {!difficulty ? (
                        <div className="w-full space-y-6">
                            <p className="text-gray-300 text-sm">Select your challenge range to generate the secret number:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.label}
                                        onClick={() => handleDifficultySelect(diff)}
                                        className="p-5 rounded-2xl bg-black/40 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-900/20 hover:scale-105 transition-all text-center group"
                                    >
                                        <p className="font-gaming text-lg font-bold text-white group-hover:text-purple-300">{diff.label}</p>
                                        <p className="text-xs text-gray-400 mt-1">Range: 1 – {diff.range}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6">
                                <span>Range: 1 – {difficulty.range}</span>
                                <button 
                                    onClick={() => setDifficulty(null)} 
                                    className="ml-1 text-gray-400 hover:text-white underline text-[11px]"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Mystery Number Chamber */}
                            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-5xl font-gaming font-extrabold text-amber-300 bg-gradient-to-br from-amber-950/30 via-purple-950/20 to-black rounded-3xl border-2 border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] mb-8 animate-pulse">
                                {message === "🎉 Correct Number!" ? number : "?"}
                            </div>

                            {/* Input Form */}
                            <div className="flex items-center gap-3 mb-6 w-full max-w-xs">
                                <input
                                    type="number"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                                    className="w-full px-4 py-3 bg-black/60 text-white font-gaming text-2xl border-2 border-purple-500/40 focus:border-purple-400 rounded-xl text-center outline-none shadow-inner transition-colors"
                                    placeholder="#"
                                    min={1}
                                    max={difficulty.range}
                                    disabled={score === 0 || message === "🎉 Correct Number!"}
                                />
                                <button
                                    onClick={handleCheck}
                                    disabled={score === 0 || message === "🎉 Correct Number!"}
                                    className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl font-gaming font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all whitespace-nowrap"
                                >
                                    Check!
                                </button>
                            </div>

                            {/* Feedback message */}
                            <div className="p-3 px-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-sm font-semibold mb-6 shadow-inner">
                                {message}
                            </div>

                            {/* Score and High Score Badges */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center mb-6">
                                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/20">
                                    <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Current Score</p>
                                    <p className="text-2xl font-extrabold font-gaming text-white mt-0.5">💯 {score}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20">
                                    <p className="text-xs text-amber-300 uppercase tracking-wider font-semibold">High Score</p>
                                    <p className="text-2xl font-extrabold font-gaming text-amber-400 mt-0.5">🥇 {highScore}</p>
                                </div>
                            </div>

                            {(score === 0 || message === "🎉 Correct Number!") && (
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
                    <Leaderboard gameId="guessmynumber" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default GuessMyNumber;
