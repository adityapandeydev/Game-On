import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
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
        const baseClass = "w-full py-3 px-6 mb-3 text-white rounded-lg transition-colors";
        if (option === currentQuestion.capital && showNext) {
            return `${baseClass} bg-green-600`;
        }
        if (wrongAnswers.has(option)) {
            return `${baseClass} bg-red-600`;
        }
        return `${baseClass} bg-purple-600 hover:bg-purple-500`;
    }, [currentQuestion.capital, showNext, wrongAnswers]);

    return (
        <div className="container mx-auto px-4 py-4 max-w-3xl">
            <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4">Geo Quest</h2>

                <div className="flex flex-col items-center gap-4 mb-4 w-full">
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md text-center">
                        <div className="bg-gray-700 p-2 rounded-lg">
                            <p className="text-gray-300 text-sm">💯 Score</p>
                            <p className="text-xl text-white">{score}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded-lg">
                            <p className="text-gray-300 text-sm">🏆 High Score</p>
                            <p className="text-xl text-white">{highScore}</p>
                        </div>
                    </div>

                    <div className="bg-gray-900 p-3 rounded-lg w-full max-w-md">
                        <h3 className="text-lg text-white text-center mb-3">
                            What is the capital of {currentQuestion.country}?
                        </h3>
                        
                        <div className="flex flex-col gap-2">
                            {currentQuestion.options.map((option) => (
                                <button
                                    key={`option-${option}`}
                                    className={`${getButtonClass(option)} py-2`}
                                    onClick={() => handleOptionSelect(option)}
                                    disabled={showNext || (score === 0) || wrongAnswers.has(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-lg text-gray-300 mb-3">{feedback}</p>

                {showNext && (
                    <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                    >
                        Next Question
                    </button>
                )}
            </div>
            
            <Leaderboard gameId="capitalcities" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default CapitalCitiesQuiz;
