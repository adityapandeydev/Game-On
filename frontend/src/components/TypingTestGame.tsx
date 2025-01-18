import React, { useState, useCallback, useEffect } from "react";
import { ScoreService } from "../services/ScoreService";
import { GameResult } from "../types/game";
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
        const baseClass = "w-full px-4 py-2 bg-gray-900 text-white border-4 border-purple-600 rounded-lg text-xl";
        if (!isGameActive) return `${baseClass} opacity-50`;
        if (userInput === targetText) return `${baseClass} border-green-500`;
        if (targetText.startsWith(userInput)) return `${baseClass} border-yellow-500`;
        return `${baseClass} border-red-500`;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">TypeStorm</h2>

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
                                    <p className="text-gray-300">🎯 Accuracy</p>
                                    <p className="text-2xl text-white">{accuracy}%</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-gray-300">⚡ WPM</p>
                                    <p className="text-2xl text-white">{typingSpeed}</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-gray-300">💯 Score</p>
                                    <p className="text-2xl text-white">{score}</p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-900 p-4 rounded-lg">
                                <p className="text-lg text-gray-300 mb-4 text-center">{targetText}</p>
                            </div>

                            <input
                                type="text"
                                value={userInput}
                                onChange={handleInputChange}
                                className={getInputClass()}
                                placeholder="Start typing here..."
                                disabled={!isGameActive}
                            />
                        </div>

                        <p className="text-xl text-gray-300 mb-4">{message}</p>

                        {isGameReady && !isGameActive && (
                            <button
                                onClick={handleStartGame}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors mb-4"
                            >
                                Start Typing
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
            
            <Leaderboard gameId="typingtest" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default TypingTestGame;
