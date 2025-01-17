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

            if (newScores[activePlayer] >= 100) {
                setPlaying(false);
                setDice(null);
            } else {
                switchPlayer();
            }
        }
    };

    return (
        <main className="flex flex-col items-center justify-center h-screen text-gray-900">
            <div className="flex flex-wrap w-full max-w-4xl gap-4">
                {[0, 1].map((player) => (
                    <div
                        key={player}
                        className={`flex-1 flex flex-col items-center p-6 rounded-lg ${activePlayer === player ? "bg-white" : "bg-gray-200"
                            } ${!playing && scores[player] >= 100 ? "bg-green-500 text-white" : ""}`}
                        style={{ minWidth: "300px" }} // Ensures player cards stack gracefully
                    >
                        <h2 className="text-2xl font-bold">{`Player ${player + 1}`}</h2>
                        <p className="text-6xl font-bold mt-2">{scores[player]}</p>
                        <div
                            className={`mt-4 p-4 rounded-lg text-white ${activePlayer === player ? "bg-pink-500" : "bg-gray-300"
                                }`}
                        >
                            <p className="text-xl">Current</p>
                            <p className="text-2xl font-bold">{activePlayer === player ? currentScore : 0}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
                {dice !== null && (
                    <img
                        src={`/dice-${dice}.png`}
                        alt={`Dice ${dice}`}
                        className="w-16 h-16 sm:w-20 sm:h-20" // Scales dice image on larger screens
                    />
                )}
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={rollDice}
                        className="btn bg-blue-500 text-white px-4 py-2 rounded sm:px-6 sm:py-3" // Scales buttons on larger screens
                    >
                        🎲 Roll Dice
                    </button>
                    <button
                        onClick={holdScore}
                        className="btn bg-green-500 text-white px-4 py-2 rounded sm:px-6 sm:py-3"
                    >
                        📥 Hold
                    </button>
                    {!playing && scores[activePlayer] < 100 && (
                        <button
                            onClick={initGame}
                            className="btn bg-gray-500 text-white px-4 py-2 rounded sm:px-6 sm:py-3"
                        >
                            🔄 New Game
                        </button>
                    )}
                </div>
            </div>
        </main>

    );
};

export default PigGame;
