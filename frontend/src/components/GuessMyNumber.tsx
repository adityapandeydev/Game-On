import React, { useState } from "react";

interface Difficulty {
    label: string;
    range: number;
    mistakeInterval: number; // Number of mistakes after which the score decreases
}

const difficulties: Difficulty[] = [
    { label: "Easy", range: 20, mistakeInterval: 1 },   // 1 mistake reduces score by 1
    { label: "Medium", range: 60, mistakeInterval: 3 },  // 3 mistakes reduce score by 1
    { label: "Hard", range: 100, mistakeInterval: 5 },   // 5 mistakes reduce score by 1
];

const GuessMyNumber: React.FC = () => {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [number, setNumber] = useState<number | null>(null);
    const [score, setScore] = useState<number>(20);  // Score starts at 20
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Start guessing...");
    const [guess, setGuess] = useState<string>("");
    const [attempts, setAttempts] = useState<number>(0);  // Track number of attempts

    const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
        setDifficulty(selectedDifficulty);
        setScore(20); // Reset score to 20 on difficulty select
        setAttempts(0); // Reset attempts to 0
        setNumber(Math.trunc(Math.random() * selectedDifficulty.range) + 1);  // Generate new random number
    };

    const getHint = (guessNumber: number) => {
        if (!difficulty || !number) return "";

        const difference = Math.abs(guessNumber - number);
        const rangePercentage = difference / difficulty.range;

        // Easy hints (Too Big, Too Small)
        if (difficulty.label === "Easy") {
            if (guessNumber < number) return "📉 Too Small!";
            if (guessNumber > number) return "📈 Too Big!";
        }

        // Medium hints (Too Small, Big, Too Big)
        if (difficulty.label === "Medium") {
            if (guessNumber < number) return "📉 Too Small!";
            if (guessNumber > number) {
                if (rangePercentage < 0.5) return "📊 Big!";
                if (rangePercentage >= 0.5) return "📈 Too Big!";
            }
        }

        // Hard hints (Too Small, Small, Big, Too Big)
        if (difficulty.label === "Hard") {
            if (guessNumber < number) {
                if (rangePercentage < 0.5) return "📊 Small!";
                if (rangePercentage >= 0.5) return "📈 Too Small!";
            }
            if (guessNumber > number) {
                if (rangePercentage < 0.5) return "📊 Big!";
                if (rangePercentage >= 0.5) return "📈 Too Big!";
            }
        }

        return "";
    };

    const handleCheck = () => {
        const guessNumber = Number(guess);
    
        if (!guess) {
            setMessage("⛔ Number not found!");
            return;
        }
    
        const hintMessage = getHint(guessNumber);
        setMessage(hintMessage);
    
        if (guessNumber === number) {
            setMessage("🎉 Correct Number!");
            document.body.style.backgroundColor = "#60b300"; // Change background color
            if (score > highScore) {
                setHighScore(score); // Update high score
            }
        } else {
            // Increment attempts only for wrong guesses
            setAttempts(attempts + 1);
    
            // Handle score decrease based on difficulty and attempts
            if (difficulty) {
                // Easy: Decrease score after every wrong guess
                if (difficulty.label === "Easy" && score > 1 && attempts > 0 && attempts <= difficulty.range) {
                    setScore(score - 1); // Decrease score for every wrong guess
                }
    
                // Medium: Decrease score every 3rd wrong guess
                else if (difficulty.label === "Medium" && attempts % 3 === 0 && attempts > 0 && score > 1) {
                    setScore(score - 1); // Decrease score every 3rd wrong guess
                }
    
                // Hard: Decrease score every 5th wrong guess
                else if (difficulty.label === "Hard" && attempts % 5 === 0 && attempts > 0 && score > 1) {
                    setScore(score - 1); // Decrease score every 5th wrong guess
                }
    
                // If score reaches 1, it's the end of the game
                if (score === 1) {
                    setMessage("😂 You Lost!");
                    setScore(0);
                }
            }
        }
    };            

    const handleAgain = () => {
        if (difficulty) {
            setScore(20); // Reset score to 20
            setAttempts(0); // Reset attempts to 0
            setNumber(Math.trunc(Math.random() * difficulty.range) + 1); // Generate new random number based on selected range
        }
        setMessage("Start guessing...");
        setGuess("");
        document.body.style.backgroundColor = "#222"; // Reset background color
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            handleCheck();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-lg">
            {!difficulty ? (
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl font-bold text-white mb-6">Select Difficulty</h1>
                    <div className="flex gap-4">
                        {difficulties.map((diff) => (
                            <button
                                key={diff.label}
                                onClick={() => handleDifficultySelect(diff)}
                                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-500"
                            >
                                {diff.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="text-3xl font-bold text-white mb-4">Guess My Number!</h1>
                    <p className="text-white text-lg mb-6">
                        (Between 1 and {difficulty.range})
                    </p>

                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="flex items-center justify-center text-gray-900 bg-gray-100 w-20 h-20 rounded-full text-4xl font-bold mb-4">
                            ?
                        </div>

                        <div className="flex gap-4">
                            <input
                                type="number"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-gray-900 text-white border-2 border-pink-600 rounded-md text-xl p-2 w-20 text-center"
                            />
                            <button
                                onClick={handleCheck}
                                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-500"
                            >
                                Check!
                            </button>
                        </div>
                    </div>

                    <p className="text-lg text-white mb-4">{message}</p>

                    <div className="flex flex-col items-center gap-2">
                        <p className="text-white text-lg">💯 Score: {score}</p>
                        <p className="text-white text-lg">🥇 Highscore: {highScore}</p>
                    </div>

                    {(score === 0 || message === "🎉 Correct Number!") && (
                        <button
                            onClick={handleAgain}
                            className="mt-6 bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-500"
                        >
                            Again!
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default GuessMyNumber;
