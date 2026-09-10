import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import type { GameResult } from "../types/game";
import Leaderboard from './Leaderboard';

interface Question {
    country: string;
    capital: string;
    options: string[];
}

interface CapitalCitiesQuizProps {
    userId?: string;
}

const quizQuestions: Question[] = [
    { country: "France", capital: "Paris", options: ["Paris", "Lyon", "Marseille", "Nice"] },
    { country: "Japan", capital: "Tokyo", options: ["Tokyo", "Osaka", "Kyoto", "Nagoya"] },
    { country: "Australia", capital: "Canberra", options: ["Sydney", "Canberra", "Melbourne", "Brisbane"] },
    { country: "India", capital: "New Delhi", options: ["Mumbai", "Chennai", "New Delhi", "Kolkata"] },
    { country: "Brazil", capital: "Brasília", options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"] },
    { country: "Egypt", capital: "Cairo", options: ["Alexandria", "Cairo", "Giza", "Luxor"] },
    { country: "Germany", capital: "Berlin", options: ["Munich", "Hamburg", "Frankfurt", "Berlin"] },
    { country: "Canada", capital: "Ottawa", options: ["Toronto", "Vancouver", "Ottawa", "Montreal"] },
];

const CapitalCitiesQuiz: React.FC<CapitalCitiesQuizProps> = ({ userId }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<string>("Start guessing...");
    const [showNext, setShowNext] = useState<boolean>(false);
    const [score, setScore] = useState<number>(20);
    const [highScore, setHighScore] = useState<number>(0);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const currentQuestion = quizQuestions[currentQuestionIndex];

    const handleGameEnd = useCallback(async (result: GameResult) => {
        if (!userId) return;
        
        try {
            await ScoreService.saveScore('capitalcities', userId, result);
            setRefreshLeaderboard(prev => prev + 1);
        } catch (error) {
            console.error('Failed to save score:', error);
        }
    }, [userId]);

    const handleOptionSelect = useCallback((option: string) => {
        setSelectedOption(option);

        if (option === currentQuestion.capital) {
            setFeedback("🎉 Correct!");
            setShowNext(true);
            if (score > highScore) {
                setHighScore(score);
            }
            handleGameEnd('win');
        } else {
            setWrongAnswers(prev => new Set([...prev, option]));
            setFeedback("❌ Incorrect. Try Again!");
            if (score > 1) {
                setScore(prev => prev - 1);
            } else {
                setScore(0);
                setFeedback("😢 Game Over!");
                handleGameEnd('lose');
            }
        }
    }, [currentQuestion.capital, score, highScore, handleGameEnd]);

    const handleNextQuestion = useCallback(() => {
        setSelectedOption(null);
        setWrongAnswers(new Set());
        setFeedback("Start guessing...");
        setShowNext(false);
        setScore(20);
        setCurrentQuestionIndex((prevIndex) =>
            prevIndex + 1 < quizQuestions.length ? prevIndex + 1 : 0
        );
    }, []);

    const getButtonClass = useCallback((option: string) => {
        const baseClass = "w-full py-3.5 px-6 rounded-xl font-gaming text-sm font-semibold transition-all duration-200 text-center";
        if (option === currentQuestion.capital && showNext) {
            return `${baseClass} bg-gradient-to-r from-emerald-500 to-green-600 border-2 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]`;
        }
        if (wrongAnswers.has(option)) {
            return `${baseClass} bg-rose-950/60 border ${selectedOption === option ? 'border-rose-400 ring-2 ring-rose-500/50' : 'border-rose-500/60'} text-rose-300 opacity-50 line-through cursor-not-allowed`;
        }
        return `${baseClass} bg-black/50 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-900/25 text-white hover:scale-[1.02] shadow-sm`;
    }, [currentQuestion.capital, showNext, wrongAnswers, selectedOption]);

    return (
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center text-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest mb-3">
                        Global Trivia
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-wider mb-6">
                        GEO QUEST
                    </h2>

                    {/* Stats Badges */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-center mb-6">
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/20">
                            <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">Current Score</p>
                            <p className="text-2xl font-extrabold font-gaming text-white mt-0.5">💯 {score}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20">
                            <p className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">High Score</p>
                            <p className="text-2xl font-extrabold font-gaming text-emerald-400 mt-0.5">🏆 {highScore}</p>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-black to-purple-950/20 border-2 border-emerald-500/30 shadow-inner mb-6">
                        <p className="text-xs text-emerald-300 uppercase tracking-widest font-semibold mb-2">Identify Capital</p>
                        <h3 className="text-2xl font-extrabold text-white font-sans">
                            What is the capital of <span className="text-emerald-400">{currentQuestion.country}</span>?
                        </h3>
                    </div>

                    {/* Options Grid */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={`option-${option}`}
                                className={getButtonClass(option)}
                                onClick={() => handleOptionSelect(option)}
                                disabled={showNext || (score === 0) || wrongAnswers.has(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* Feedback Message */}
                    <div className="p-3 px-6 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-sm font-semibold mb-6 shadow-inner">
                        {feedback}
                    </div>

                    {/* Next Question / Play Again Button */}
                    {showNext && (
                        <button
                            onClick={handleNextQuestion}
                            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:scale-105 transition-all"
                        >
                            Next Question →
                        </button>
                    )}
                </div>
                
                <div className="mt-8">
                    <Leaderboard gameId="capitalcities" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default CapitalCitiesQuiz;
