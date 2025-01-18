import React, { useState, useCallback } from "react";
import { ScoreService } from "../services/ScoreService";
import Leaderboard from './Leaderboard';

interface PigGameProps {
    userId?: string;
}

const PigGame: React.FC<PigGameProps> = ({ userId }) => {
    const [scores, setScores] = useState([0, 0]);
    const [currentScore, setCurrentScore] = useState(0);
    const [activePlayer, setActivePlayer] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [dice, setDice] = useState<number | null>(null);
    const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

    const handleGameEnd = useCallback(async () => {
        if (!userId) return;
        
        if (activePlayer === 0 && scores[0] === 20) {
            try {
                await ScoreService.saveScore('piggame', userId, 'win');
                setRefreshLeaderboard(prev => prev + 1);
            } catch (error) {
                console.error('Failed to save score:', error);
            }
        } else {
            await ScoreService.saveScore('piggame', userId, 'lose');
            setRefreshLeaderboard(prev => prev + 1);
        }
    }, [userId, activePlayer, scores]);

    const initGame = () => {
        setScores([0, 0]);
        setCurrentScore(0);
        setActivePlayer(0);
        setPlaying(true);
        setDice(null);
        setRefreshLeaderboard(prev => prev + 1);
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
                if (currentScore === 0) {
                    handleGameEnd();
                }
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
                handleGameEnd();
            } else {
                switchPlayer();
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6">Pig Game</h2>

                <div className="flex flex-col sm:flex-row gap-6 w-full mb-8">
                    {[0, 1].map((player) => (
                        <div
                            key={`player-${player}`}
                            className={`flex-1 flex flex-col items-center p-6 rounded-lg ${
                                activePlayer === player ? "bg-gray-700" : "bg-gray-900"
                            } ${!playing && scores[player] >= 20 ? "bg-green-600" : ""}`}
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Player {player + 1}
                            </h3>
                            <p className="text-4xl font-bold text-white mb-6">
                                {scores[player]}
                            </p>
                            {!playing && scores[player] >= 20 ? (
                                <p className="text-xl font-bold text-white">🏆 Winner!</p>
                            ) : (
                                <div className={`p-4 rounded-lg ${
                                    activePlayer === player ? "bg-purple-600" : "bg-gray-700"
                                }`}>
                                    <p className="text-lg text-white mb-2">Current</p>
                                    <p className="text-3xl font-bold text-white">
                                        {activePlayer === player ? currentScore : 0}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-6">
                    {dice !== null && (
                        <img
                            src={`/dice-${dice}.png`}
                            alt={`Dice ${dice}`}
                            className="w-20 h-20 rounded-lg bg-gray-900 p-2"
                        />
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={rollDice}
                            disabled={!playing}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                            🎲 Roll Dice
                        </button>
                        <button
                            onClick={holdScore}
                            disabled={!playing}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                            📥 Hold
                        </button>
                    </div>

                    {!playing && (
                        <button
                            onClick={initGame}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                        >
                            Play Again
                        </button>
                    )}
                </div>
            </div>

            <Leaderboard gameId="piggame" refreshTrigger={refreshLeaderboard} />
        </div>
    );
};

export default PigGame;
