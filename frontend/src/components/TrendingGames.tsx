import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFire, FaGamepad } from 'react-icons/fa';
import { ScoreService } from '../services/ScoreService';

interface TrendingGame {
    gameId: string;
    gameName: string;
    clickCount: number;
}

const GAME_ROUTES: { [key: string]: string } = {
    'tictactoe': '/tictactoe',
    'connect4': '/connect4',
    'guess-number': '/guess-number',
    'guessmynumber': '/guess-number',
    'pig-game': '/pig-game',
    'piggame': '/pig-game',
    'math-quiz': '/math-quiz',
    'mathquiz': '/math-quiz',
    'capital-cities': '/capital-cities',
    'capitalcities': '/capital-cities',
    'typing-test': '/typing-test',
    'typestorm': '/typing-test',
    'sliding-puzzle': '/sliding-puzzle',
    'slidingpuzzle': '/sliding-puzzle',
    'tetris': '/tetris'
};

const INITIAL_TRENDING_GAMES: TrendingGame[] = [
    { gameId: 'tictactoe', gameName: 'Tic Tac Toe', clickCount: 1420 },
    { gameId: 'connect4', gameName: 'Connect 4', clickCount: 1180 },
    { gameId: 'tetris', gameName: 'Tetris', clickCount: 950 },
    { gameId: 'mathquiz', gameName: 'Quantum Guess', clickCount: 840 },
    { gameId: 'capitalcities', gameName: 'Geo Quest', clickCount: 720 }
];

const TrendingGames: React.FC = () => {
    const [trendingGames, setTrendingGames] = useState<TrendingGame[]>(INITIAL_TRENDING_GAMES);
    const [loading, setLoading] = useState(true);
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
            }).catch(() => {});

            // Track recently played
            ScoreService.trackGamePlay(gameId, gameName);

            // Navigate to the game
            navigate(route);
        } catch (error) {
            console.error('Error tracking game click:', error);
        }
    };

    if (loading) {
        return (
            <div className="glass-panel rounded-2xl p-8 text-center text-gray-400">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3" />
                <p className="font-sans text-sm tracking-wide">Loading trending games...</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-purple-500/20">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                        <FaFire size={22} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-gaming text-white tracking-wide">Top Arcade Hits</h2>
                        <p className="text-xs text-gray-400">Most played games across the platform</p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    Live Leaderboard
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {trendingGames.map((game, index) => {
                    const rankGlow =
                        index === 0
                            ? 'from-amber-500/20 to-orange-500/10 border-amber-500/40 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                            : index === 1
                            ? 'from-slate-300/20 to-gray-500/10 border-slate-300/40 hover:border-slate-200'
                            : index === 2
                            ? 'from-amber-700/20 to-yellow-800/10 border-amber-700/40 hover:border-amber-600'
                            : 'from-purple-900/20 to-gray-900/40 border-purple-500/20 hover:border-purple-400/50';

                    const rankBadge =
                        index === 0
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-extrabold'
                            : index === 1
                            ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black font-extrabold'
                            : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white font-extrabold'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/30';

                    return (
                        <div
                            key={game.gameId}
                            onClick={() => handleGameClick(game.gameId, game.gameName)}
                            className={`group p-4 rounded-xl bg-gradient-to-br ${rankGlow} border cursor-pointer hover:scale-[1.02] transition-all duration-300 backdrop-blur-md flex items-center justify-between`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shadow-md flex-shrink-0 ${rankBadge}`}>
                                    #{index + 1}
                                </span>
                                <div className="truncate">
                                    <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                        {game.gameName}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                        <FaGamepad size={12} className="text-purple-400" />
                                        <span>{game.clickCount.toLocaleString()} plays</span>
                                    </p>
                                </div>
                            </div>

                            {index === 0 && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 animate-pulse">
                                    🔥 Hot
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrendingGames; 