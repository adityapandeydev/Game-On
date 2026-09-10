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
        <div className="min-h-[calc(100vh-4rem)] py-10 px-4">
            <div className="container mx-auto max-w-4xl space-y-10">
                <div className="glass-panel p-8 sm:p-10 rounded-3xl max-w-2xl mx-auto relative overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col items-center text-center">
                    {/* Ambient Glows */}
                    <div className="absolute -top-24 -left-24 w-52 h-52 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-widest mb-3">
                        Risk & Reward Dice Duel
                    </span>
                    <h2 className="text-4xl font-extrabold font-gaming text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 tracking-wider mb-8">
                        PIG GAME
                    </h2>

                    {/* Dual Player Arena Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-8">
                        {[0, 1].map((player) => {
                            const isActive = activePlayer === player;
                            const isWinner = !playing && scores[player] >= 20;

                            return (
                                <div
                                    key={`player-${player}`}
                                    className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center ${
                                        isWinner
                                            ? "bg-emerald-950/40 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                            : isActive
                                            ? "bg-purple-950/40 border-2 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02]"
                                            : "bg-black/40 border-white/10 opacity-70"
                                    }`}
                                >
                                    {isActive && playing && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                                            Active
                                        </div>
                                    )}

                                    <h3 className="font-gaming text-xl font-bold text-white mb-2 tracking-wide">
                                        Player {player + 1}
                                    </h3>

                                    <p className="font-gaming text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 my-3">
                                        {scores[player]}
                                    </p>

                                    {isWinner ? (
                                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-gaming font-bold text-lg animate-bounce mt-2">
                                            🏆 Champion!
                                        </div>
                                    ) : (
                                        <div className={`w-full max-w-[180px] p-3 rounded-xl border mt-2 ${
                                            isActive
                                                ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-400/50"
                                                : "bg-black/30 border-white/5"
                                        }`}>
                                            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Turn Pot</p>
                                            <p className="text-2xl font-gaming font-extrabold text-white mt-0.5">
                                                {isActive ? currentScore : 0}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Dice and Actions Center */}
                    <div className="flex flex-col items-center gap-6 w-full">
                        {/* Dice Display */}
                        {dice !== null ? (
                            <div className="p-3 bg-black/60 border-2 border-purple-500/40 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.25)] transform hover:rotate-6 transition-transform">
                                <img
                                    src={`/dice-${dice}.png`}
                                    alt={`Dice ${dice}`}
                                    className="w-20 h-20 rounded-xl"
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center text-gray-500 text-3xl font-gaming">
                                🎲
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                                onClick={rollDice}
                                disabled={!playing}
                                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition-all transform hover:scale-105"
                            >
                                🎲 Roll Dice
                            </button>
                            <button
                                onClick={holdScore}
                                disabled={!playing}
                                className="px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-40 transition-all transform hover:scale-105"
                            >
                                📥 Hold Score
                            </button>
                        </div>

                        {!playing && (
                            <button
                                onClick={initGame}
                                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-gaming font-bold shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:scale-105 transition-all"
                            >
                                New Match
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Leaderboard gameId="piggame" refreshTrigger={refreshLeaderboard} />
                </div>
            </div>
        </div>
    );
};

export default PigGame;
