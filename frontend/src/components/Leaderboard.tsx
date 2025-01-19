import React, { useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal } from 'react-icons/fa';

interface Score {
    _id: string;
    userId: {
        _id: string;
        name: string;
    };
    score: number;
    gameName: string;
    timestamp: string;
}

interface LeaderboardProps {
    selectedGame: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ selectedGame }) => {
    const [leaderboardData, setLeaderboardData] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = async (gameId: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(`/api/leaderboard/${gameId}`);
            setLeaderboardData(response.data);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to fetch leaderboard data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(selectedGame);
    }, [selectedGame]);

    const getMedalIcon = (position: number) => {
        switch (position) {
            case 0:
                return <FaTrophy className="text-yellow-400 text-2xl" />;
            case 1:
                return <FaMedal className="text-gray-400 text-2xl" />;
            case 2:
                return <FaMedal className="text-amber-600 text-2xl" />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
            ) : error ? (
                <div className="text-center text-red-500">{error}</div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    {leaderboardData.map((score, index) => (
                        <motion.div
                            key={score._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-between
                                     border-2 border-purple-500/30 hover:border-purple-500 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold text-gray-400 w-8">
                                    {getMedalIcon(index) || `#${index + 1}`}
                                </span>
                                <div>
                                    <h3 className="font-gaming text-purple-400">
                                        {score.userId.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(score.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-2xl font-gaming text-white">
                                {score.score}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Leaderboard; 