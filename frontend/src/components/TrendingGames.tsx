import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFire, FaGamepad } from 'react-icons/fa';

interface TrendingGame {
    gameId: string;
    gameName: string;
    clickCount: number;
}

const GAME_ROUTES: { [key: string]: string } = {
    'tictactoe': '/tictactoe',
    'connect4': '/connect4',
    'guess-number': '/guess-number',
    'pig-game': '/pig-game',
    'math-quiz': '/math-quiz',
    'capital-cities': '/capital-cities',
    'typing-test': '/typing-test',
    'sliding-puzzle': '/sliding-puzzle',
    'tetris': '/tetris'
};

const INITIAL_TRENDING_GAMES: TrendingGame[] = [
    { gameId: 'tictactoe', gameName: 'Tic Tac Toe', clickCount: 0 },
    { gameId: 'connect4', gameName: 'Connect 4', clickCount: 0 },
    { gameId: 'tetris', gameName: 'Tetris', clickCount: 0 },
    { gameId: 'math-quiz', gameName: 'Quantum Guess', clickCount: 0 },
    { gameId: 'capital-cities', gameName: 'Geo Quest', clickCount: 0 }
];

const TrendingGames: React.FC = () => {
    const [trendingGames, setTrendingGames] = useState<TrendingGame[]>(INITIAL_TRENDING_GAMES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTrendingGames();
        const interval = setInterval(fetchTrendingGames, 300000);
        return () => clearInterval(interval);
    }, []);

    const fetchTrendingGames = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/trending');
            
            if (!response.ok) {
                throw new Error('Failed to fetch trending games');
            }
            
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                setTrendingGames(data);
            }
        } catch (err) {
            console.error('Error fetching trending games:', err);
            // Fallback to initial trending games if API fails
            setTrendingGames(INITIAL_TRENDING_GAMES);
        } finally {
            setLoading(false);
        }
    };

    const handleGameClick = async (gameId: string, gameName: string) => {
        try {
            const route = GAME_ROUTES[gameId];
            if (!route) {
                console.error('No route found for game:', gameId);
                return;
            }

            // Track the click
            await fetch(`/api/trending/track/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({ gameName })
            });

            // Navigate to the game
            navigate(route);
        } catch (error) {
            console.error('Error tracking game click:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
                <div className="text-center text-gray-400">Loading trending games...</div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
                <FaFire size={24} className="text-orange-500" />
                <h2 className="text-2xl font-bold">Top Games</h2>
            </div>

            <div className="space-y-4">
                {trendingGames.map((game, index) => (
                    <div
                        key={game.gameId}
                        onClick={() => handleGameClick(game.gameId, game.gameName)}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                            <div>
                                <h3 className="font-semibold">{game.gameName}</h3>
                                <p className="text-sm text-gray-400">
                                    <FaGamepad size={14} className="inline mr-1" />
                                    {game.clickCount.toLocaleString()} plays
                                </p>
                            </div>
                        </div>
                        <div className="text-purple-400">
                            {index === 0 && <span className="text-yellow-400">🔥 Hot!</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrendingGames; 