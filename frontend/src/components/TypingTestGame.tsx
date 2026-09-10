import React, { useState, useCallback, useEffect } from "react";
import { ScoreService } from "../services/ScoreService";
import type { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface Difficulty {
    label: string;
    text: string;
    timeLimit: number;
}

const difficulties: Difficulty[] = [
    { 
        label: "Easy", 
        text: "The quick brown fox jumps over the lazy dog.",
        timeLimit: 30
    },
    { 
        label: "Medium", 
        text: "Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
        timeLimit: 45
    },
    { 
        label: "Hard", 
        text: "The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs. The quick brown fox jumps over the lazy dog.",
        timeLimit: 60
    },
];

interface TypingTestProps {
    userId?: string;
}

const TypingTestGame: React.FC<TypingTestProps> = ({ userId }) => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [targetText, setTargetText] = useState<string>("");
    const [userInput, setUserInput] = useState<string>("");
    const [score, setScore] = useState<number>(100);
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Welcome to TypeStorm! Select difficulty to start!");
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [isGameReady, setIsGameReady] = useState<boolean>(false);
    const [typingSpeed, setTypingSpeed] = useState<number>(0);
    const [accuracy, setAccuracy] = useState<number>(100);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    useEffect(() => {
        if (isGameActive && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleGameEnd('lose');
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isGameActive, timeLeft]);

    useEffect(() => {
        if (userInput.length > 0 && isGameActive) {
            // Calculate WPM
            const words = userInput.split(' ').length;
            const minutes = (difficulty!.timeLimit - timeLeft) / 60;
            setTypingSpeed(Math.round(words / minutes));

            // Calculate accuracy
            let correctChars = 0;
            for (let i = 0; i < userInput.length; i++) {
                if (userInput[i] === targetText[i]) correctChars++;
            }
            const newAccuracy = Math.round((correctChars / userInput.length) * 100);
            setAccuracy(newAccuracy);

            // Update score based on accuracy
            if (newAccuracy < accuracy) {
                setScore(prev => Math.max(0, prev - 5));
            }
        }
    }, [userInput, timeLeft, difficulty, isGameActive, accuracy, targetText]);

    const handleDifficultySelect = useCallback((selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setTargetText(selectedDifficulty.text);
        setTimeLeft(selectedDifficulty.timeLimit);
        setIsGameReady(true);
        setIsGameActive(false);
        setUserInput("");
        setScore(100);
        setMessage("Welcome to TypeStorm! Select difficulty to start!");
        setTypingSpeed(0);
        setAccuracy(100);
    }, []);

    const handleStartGame = useCallback(() => {
        setIsGameActive(true);
        setMessage("Start typing...");
    }, []);

    const handleGameEnd = useCallback(async (result: GameResult) => {
        setIsGameActive(false);
        setIsGameReady(false);
        if (!userId) return;
        
        try {
            if (result === 'win' && score > highScore) {
                setHighScore(score);
            }
            await ScoreService.saveScore('typingtest', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
            setMessage(result === 'win' ? "🎉 Well done! Try another difficulty?" : "⏰ Time's up!");
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId, score, highScore]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setUserInput(input);
        
        if (input === targetText) {
            handleGameEnd('win');
        }
    };

    const getInputClass = () => {
        const baseClass = "w-full px-5 py-3.5 bg-black/60 text-white font-mono text-lg border-2 rounded-xl outline-none transition-all shadow-inner";
        if (!isGameActive) return `${baseClass} opacity-40 border-gray-700 cursor-not-allowed`;
        if (userInput === targetText) return `${baseClass} border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]`;
        if (targetText.startsWith(userInput)) return `${baseClass} border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)]`;
        return `${baseClass} border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.4)]`;
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-2xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center text-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest mb-3">
                        Speed & Precision Reflexes
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 tracking-wider mb-6">
                        TYPESTORM
                    </h2>

                    {!difficulty ? (
                        <div className="w-full space-y-6">
                            <p className="text-gray-300 text-sm">Select text passage duration and complexity:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {difficulties.map((diff) => (
                                    <button
                                        key={diff.label}
                                        onClick={() => handleDifficultySelect(diff)}
                                        className="p-5 rounded-2xl bg-black/40 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/20 hover:scale-105 transition-all text-center group"
                                    >
                                        <p className="font-gaming text-lg font-bold text-white group-hover:text-cyan-300">{diff.label}</p>
                                        <p className="text-xs text-gray-400 mt-1">{diff.timeLimit}s Time Limit</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                            {/* HUD Telemetry Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6 text-center">
                                <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/20">
                                    <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold">⏳ Time</p>
                                    <p className={`text-2xl font-extrabold font-gaming mt-0.5 ${timeLeft <= 5 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                                        {timeLeft}s
                                    </p>
                                </div>
                                <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/20">
                                    <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">🎯 Accuracy</p>
                                    <p className="text-2xl font-extrabold font-gaming text-purple-300 mt-0.5">{accuracy}%</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/20">
                                    <p className="text-xs text-amber-300 uppercase tracking-wider font-semibold">⚡ Speed</p>
                                    <p className="text-2xl font-extrabold font-gaming text-amber-300 mt-0.5">{typingSpeed} <span className="text-xs font-sans">WPM</span></p>
                                </div>
                                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
                                    <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">💯 Score</p>
                                    <p className="text-2xl font-extrabold font-gaming text-emerald-300 mt-0.5">{score}</p>
                                </div>
                            </div>

                            {/* Cyber Terminal Target Text Display */}
                            <div className="w-full bg-black/60 border-2 border-cyan-500/30 rounded-2xl p-5 mb-6 text-left shadow-inner">
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/20">
                                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Cyber Terminal Stream</span>
                                    <span className="text-[11px] font-mono text-gray-500">READY FOR INPUT</span>
                                </div>
                                <p className="font-mono text-base sm:text-lg text-gray-200 leading-relaxed select-none">
                                    {targetText}
                                </p>
                            </div>

                            {/* Interactive Typing Input */}
                            <div className="w-full mb-6">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={handleInputChange}
                                    className={getInputClass()}
                                    placeholder={isGameActive ? "Type as fast as you can..." : "Press Start Typing below..."}
                                    disabled={!isGameActive}
                                    autoFocus={isGameActive}
                                />
                            </div>

                            {/* Message Banner */}
                            {message && (
                                <div className="p-3 px-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-sm font-semibold mb-6 shadow-inner">
                                    {message}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                {isGameReady && !isGameActive && (
                                    <button
                                        onClick={handleStartGame}
                                        className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(6,182,212,0.4)] transform hover:scale-105 transition-all"
                                    >
                                        Start Typing ⚡
                                    </button>
                                )}

                                {(!isGameReady || !isGameActive) && (
                                    <button
                                        onClick={() => setDifficulty(null)}
                                        className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl font-gaming text-sm font-semibold transition-all"
                                    >
                                        Change Difficulty
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="mt-8">
                    <Leaderboard gameId="typingtest" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default TypingTestGame;
