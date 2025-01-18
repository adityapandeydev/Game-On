import React, { useState, useEffect } from 'react';

interface GlobalLeaderboardEntry {
    username: string;
    totalScore: number;
    gamesPlayed: number;
}

const GlobalLeaderboard: React.FC = () => {
    const [leaders, setLeaders] = useState<GlobalLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGlobalLeaderboard = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('/api/leaderboard/global', {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token ?? ''
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch global leaderboard');
                }

                const data = await response.json();
                setLeaders(data);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Error loading leaderboard');
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalLeaderboard();
    }, []);

    if (loading) return <div className="text-center text-sm">Loading...</div>;
    if (error) return <div className="text-center text-red-400 text-sm">{error}</div>;

    return (
        <div className="w-full">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Global Leaders</h3>
            <div className="space-y-2">
                {leaders.map((leader, index) => (
                    <div 
                        key={leader.username} 
                        className="flex justify-between items-center text-sm bg-gray-700 bg-opacity-40 p-2 rounded"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">#{index + 1}</span>
                            <span className="text-gray-200">{leader.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-purple-400">{leader.totalScore}</span>
                            <span className="text-xs text-gray-400">({leader.gamesPlayed} games)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GlobalLeaderboard; 