import React, { useState } from "react";

const PigGame: React.FC = () => {
    const [scores, setScores] = useState([0, 0]);
    const [currentScore, setCurrentScore] = useState(0);
    const [activePlayer, setActivePlayer] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [dice, setDice] = useState<number | null>(null);

    const initGame = () => {
        setScores([0, 0]);
        setCurrentScore(0);
        setActivePlayer(0);
        setPlaying(true);
        setDice(null);
    };

    const switchPlayer = () => {
        setCurrentScore(0);
        setActivePlayer(activePlayer === 0 ? 1 : 0);
    };

    const rollDice = () => {
        if (playing) {
            const diceRoll = Math.trunc(Math.random() * 6) + 1;
            setDice(diceRoll);

            if (diceRoll !== 1) {
                setCurrentScore((prevScore) => prevScore + diceRoll);
            } else {
                switchPlayer();
            }
        }
    };

    const holdScore = () => {
        if (playing) {
            const newScores = [...scores];
            newScores[activePlayer] += currentScore;
            setScores(newScores);

            if (newScores[activePlayer] >= 20) {
                setPlaying(false);
                setDice(null);
            } else {
                switchPlayer();
            }
        }
    };

    return (
        <main className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-100">
            <div className="flex w-full max-w-4xl gap-4">
                {[0, 1].map((player) => (
                    <div
                        key={player}
                        className={`flex-1 flex flex-col items-center p-6 rounded-lg ${activePlayer === player ? "bg-gray-800" : "bg-gray-700"
                            } ${!playing && scores[player] >= 20 ? "bg-green-600 text-white" : ""}`}
                        style={{ minWidth: "300px" }} // Ensures player cards stack gracefully
                    >
                        <h2 className="text-3xl font-bold uppercase">{`Player ${player + 1}`}</h2>
                        <p className="text-7xl font-bold mt-4">{scores[player]}</p>
                        {!playing && scores[player] >= 20 ? (
                            <p className="mt-6 text-3xl font-bold text-black">🏆 Winner!</p>
                        ) : (
                            <div
                                className={`mt-6 px-8 py-4 rounded-lg text-white text-center ${activePlayer === player ? "bg-pink-500" : "bg-gray-600"
                                    }`}
                            >
                                <p className="text-xl font-semibold">Current</p>
                                <p className="text-4xl font-bold">{activePlayer === player ? currentScore : 0}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-6">
                {dice !== null && (
                    <img
                        src={`/dice-${dice}.png`}
                        alt={`Dice ${dice}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg"
                    />
                )}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={rollDice}
                        className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition"
                    >
                        🎲 Roll Dice
                    </button>
                    <button
                        onClick={holdScore}
                        className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition"
                    >
                        📥 Hold
                    </button>
                </div>
                {!playing && (
                    <button
                        onClick={initGame}
                        className="mt-6 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition"
                    >
                        🔄 New Game
                    </button>
                )}
            </div>
        </main>

    );
};

export default PigGame;
