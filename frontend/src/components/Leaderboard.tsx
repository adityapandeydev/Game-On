import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
    username: string;
    score: number;
    currentStreak: number;
    maxStreak: number;
}

interface LeaderboardProps {
    gameId: string;
    refreshTrigger: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ gameId, refreshTrigger }) => {
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/leaderboard/game/${gameId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token ?? ''
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.reload();
                        throw new Error('Session expired. Please log in again.');
                    }
                    throw new Error('Failed to fetch leaderboard');
                }

                const data = await response.json();
                setScores(data);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Error loading leaderboard');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId, refreshTrigger]);

    if (loading) return <div className="text-center">Loading leaderboard...</div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            <div className="bg-gray-800 rounded-lg p-4">
                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2">Rank</th>
                            <th className="p-2">Player</th>
                            <th className="p-2">Score</th>
                            <th className="p-2">Streak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scores.map((entry, index) => (
                            <tr 
                                key={`${entry.username}-${index}`}
                                className="border-t border-gray-700"
                            >
                                <td className="p-2">{index + 1}</td>
                                <td className="p-2">{entry.username}</td>
                                <td className="p-2">{entry.score}</td>
                                <td className="p-2">
                                    {entry.currentStreak > 0 ? `${entry.currentStreak}🔥` : '0'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard; 