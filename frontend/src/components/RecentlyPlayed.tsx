import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GameCard from './GameCard';

interface RecentGame {
    gameId: string;
    gameName: string;
    lastPlayed: string;
}

const RecentlyPlayed: React.FC = () => {
    const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoggedIn) {
            fetchRecentGames();
        }
    }, [isLoggedIn]);

    const fetchRecentGames = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching recent games...'); // Debug log
            const response = await fetch('/api/recently-played', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch recent games');
            }

            const data = await response.json();
            console.log('Received recent games:', data); // Debug log
            setRecentGames(data);
        } catch (err) {
            console.error('Error details:', err);
            setError(err instanceof Error ? err.message : 'Error loading recent games');
        } finally {
            setLoading(false);
        }
    };

    const handleGameClick = async (gameId: string, gameName: string) => {
        try {
            // Track the game play
            await fetch('/api/recently-played/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({ gameId, gameName })
            });

            // Navigate to the game
            navigate(`/${gameId}`);
        } catch (error) {
            console.error('Error tracking game play:', error);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="text-center text-gray-400">
                Login to see your recently played games
            </div>
        );
    }

    if (loading) {
        return <div className="text-center">Loading recent games...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    if (recentGames.length === 0) {
        return (
            <div className="text-center text-gray-400">
                No recently played games
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentGames.map((game) => (
                <button
                    key={game.gameId}
                    onClick={() => handleGameClick(game.gameId, game.gameName)}
                    className="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                >
                    <GameCard 
                        title={game.gameName}
                        subtitle={`Last played: ${new Date(game.lastPlayed).toLocaleDateString()}`}
                    />
                </button>
            ))}
        </div>
    );
};

export default RecentlyPlayed; 