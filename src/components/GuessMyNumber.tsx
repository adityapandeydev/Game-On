import React, { useState } from "react";

const GuessMyNumber: React.FC = () => {
    const [number, setNumber] = useState<number>(Math.trunc(Math.random() * 20) + 1);
    const [score, setScore] = useState<number>(20);
    const [highScore, setHighScore] = useState<number>(0);
    const [message, setMessage] = useState<string>("Start guessing...");
    const [guess, setGuess] = useState<string>("");

    const handleCheck = () => {
        const guessNumber = Number(guess);

        if (!guess) {
            setMessage("⛔ Number not found!");
        } else if (guessNumber === number) {
            setMessage("🎉 Correct Number!");
            document.body.style.backgroundColor = "#60b300"; // Changing background
            if (score > highScore) {
                setHighScore(score);
            }
        } else if (guessNumber > number) {
            if (score > 1) {
                setMessage("📈 Too Big!");
                setScore(score - 1);
            } else {
                setMessage("😂 You Lost!");
                setScore(0);
            }
        } else if (guessNumber < number) {
            if (score > 1) {
                setMessage("📉 Too Small!");
                setScore(score - 1);
            } else {
                setMessage("😂 You Lost!");
                setScore(0);
            }
        }
    };

    const handleAgain = () => {
        setScore(20);
        setNumber(Math.trunc(Math.random() * 20) + 1);
        setMessage("Start guessing...");
        setGuess("");
        document.body.style.backgroundColor = "#222"; // Reset background
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-white mb-4">Guess My Number!</h1>
            <p className="text-white text-lg mb-6">(Between 1 and 20)</p>

            <div className="flex flex-col items-center justify-center mb-6">
                <div className="flex items-center justify-center text-gray-900 bg-gray-100 w-20 h-20 rounded-full text-4xl font-bold mb-4">
                    ?
                </div>

                <div className="flex gap-4">
                    <input
                        type="number"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
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

            {/* Conditionally render the Again button when the game is over */}
            {(score === 0 || message === "🎉 Correct Number!") && (
                <button
                    onClick={handleAgain}
                    className="mt-6 bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-500"
                >
                    Again!
                </button>
            )}
        </div>
    );
};

export default GuessMyNumber;
