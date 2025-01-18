import React, { useState, useCallback } from "react";

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

const GuessMyNumber: React.FC = () => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [number, setNumber] = useState<number | null>(null);
    const [score, setScore] = useState<number>(20);
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Start guessing...");
    const [guess, setGuess] = useState<string>("");
    const [attempts, setAttempts] = useState<number>(0);

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
            return;
        }

        const hintMessage = getHint(guessNumber, difficulty, number);
        setMessage(hintMessage);

        if (attempts % difficulty.mistakeInterval === 0 && score > 1) {
            setScore(prev => prev - 1);
        } else if (score === 1) {
            setScore(0);
            setMessage("😂 You Lost!");
        }
    }, [difficulty, number, guess, attempts, score, highScore, getHint]);

    const handleAgain = useCallback(() => {
        if (!difficulty) return;

        setScore(20);
        setAttempts(0);
        setNumber(Math.trunc(Math.random() * difficulty.range) + 1);
        setMessage("Start guessing...");
        setGuess("");
    }, [difficulty]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Guess My Number</h2>

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
                            (Between 1 and {difficulty.range})
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

                        {(score === 0 || message === "🎉 Correct Number!") && (
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
        </div>
    );
};

export default GuessMyNumber;
