import React, { useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown } from 'react-icons/fa';

export interface LeaderboardProps {
    gameId?: string;
    selectedGame?: string;
    refreshTrigger?: number;
}

interface ScoreEntry {
    _id?: string;
    userId?: {
        _id?: string;
        name?: string;
    } | string;
    username?: string;
    score: number;
    gameName?: string;
    timestamp?: string;
    createdAt?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameId, selectedGame, refreshTrigger = 0 }) => {
    const activeGameId = gameId || selectedGame || 'tictactoe';
    const [leaderboardData, setLeaderboardData] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const endpoint = activeGameId === 'global' 
                    ? '/api/leaderboard/global' 
                    : `/api/leaderboard/${activeGameId}`;
                
                const response = await axiosInstance.get(endpoint);
                if (isMounted) {
                    const rawData = Array.isArray(response.data) ? response.data : [];
                    setLeaderboardData(rawData);
                }
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                if (isMounted) {
                    setError('Failed to load leaderboard data.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLeaderboard();

        return () => {
            isMounted = false;
        };
    }, [activeGameId, refreshTrigger]);

    const getPlayerName = (entry: ScoreEntry) => {
        if (entry.username) return entry.username;
        if (typeof entry.userId === 'object' && entry.userId?.name) return entry.userId.name;
        return 'Arcade Master';
    };

    const getMedalBadge = (position: number) => {
        switch (position) {
            case 0:
                return (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-gray-950 font-extrabold shadow-lg shadow-yellow-500/50 ring-2 ring-yellow-400">
                        <FaCrown className="text-lg" />
                    </div>
                );
            case 1:
                return (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-400 to-gray-200 flex items-center justify-center text-gray-950 font-extrabold shadow-md ring-2 ring-slate-300">
                        <FaMedal className="text-base" />
                    </div>
                );
            case 2:
                return (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-white font-extrabold shadow-md ring-2 ring-amber-600">
                        <FaTrophy className="text-sm" />
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-gray-800/90 border border-gray-700 flex items-center justify-center text-gray-400 font-bold">
                        #{position + 1}
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-purple-400">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-400 text-sm tracking-widest uppercase">Loading High Scores...</p>
                </div>
            ) : error ? (
                <div className="text-center p-8 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400">
                    {error}
                </div>
            ) : leaderboardData.length === 0 ? (
                <div className="text-center p-12 bg-gray-900/60 border border-purple-500/20 rounded-2xl backdrop-blur-md">
                    <p className="text-2xl font-bold text-gray-300 mb-2">No Champions Yet!</p>
                    <p className="text-gray-500 text-sm">Play a game now and claim the #1 spot on the leaderboard.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboardData.map((score, index) => (
                        <motion.div
                            key={score._id || `${index}-${score.score}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl flex items-center justify-between border backdrop-blur-md transition-all duration-300 ${
                                index === 0
                                    ? 'bg-gradient-to-r from-yellow-950/40 via-purple-950/30 to-gray-900/80 border-yellow-500/50 shadow-lg shadow-yellow-500/10 hover:border-yellow-400'
                                    : 'bg-gray-900/70 border-purple-500/20 hover:border-purple-500/50 hover:bg-gray-800/80'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                {getMedalBadge(index)}
                                <div>
                                    <h3 className="font-gaming font-semibold text-lg text-white flex items-center gap-2">
                                        {getPlayerName(score)}
                                        {index === 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                                Reigning Champion
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {score.timestamp || score.createdAt
                                            ? new Date(score.timestamp || score.createdAt!).toLocaleDateString()
                                            : 'Recent match'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <div className="text-2xl font-gaming font-extrabold bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent">
                                    {score.score.toLocaleString()}
                                </div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">PTS</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;