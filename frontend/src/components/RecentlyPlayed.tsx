import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory } from 'react-icons/fa';
import GameCard from './GameCard';
import useLocalStorage from '../hooks/useLocalStorage';

export interface RecentGame {
    id: string;
    title: string;
    path?: string;
    lastPlayed: Date | string;
}

const RecentlyPlayed: React.FC = () => {
    const navigate = useNavigate();
    const [localRecentGames] = useLocalStorage<RecentGame[]>('recentlyPlayed', []);
    const [recentGames, setRecentGames] = useState<RecentGame[]>(localRecentGames);

    useEffect(() => {
        const fetchRecentGames = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch('/api/recently-played', {
                        headers: {
                            'x-auth-token': token,
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data) && data.length > 0) {
                            const mapped: RecentGame[] = data.map((item: { gameId: string; gameName: string; lastPlayed: string }) => ({
                                id: item.gameId,
                                title: item.gameName,
                                lastPlayed: item.lastPlayed
                            }));
                            setRecentGames(mapped);
                            return;
                        }
                    }
                } catch {
                    // Ignore and fall back to local
                }
            }

            // Fallback to localStorage
            try {
                const raw = localStorage.getItem('recentlyPlayed');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setRecentGames(parsed);
                        return;
                    }
                }
            } catch {
                // ignore
            }
            setRecentGames(localRecentGames);
        };

        fetchRecentGames();

        const onUpdated = () => fetchRecentGames();
        window.addEventListener('recentlyPlayedUpdated', onUpdated);
        return () => window.removeEventListener('recentlyPlayedUpdated', onUpdated);
    }, [localRecentGames]);

    const handleGameClick = (game: RecentGame) => {
        const routes: Record<string, string> = {
            "Tic-Tac-Toe": "/tictactoe",
            "Connect 4": "/connect4",
            "Guess My Number": "/guess-number",
            "Pig Game": "/pig-game",
            "Quantum Guess": "/math-quiz",
            "Geo Quest": "/capital-cities",
            "TypeStorm": "/typing-test",
            "Sliding Puzzle": "/sliding-puzzle",
            "Tetris": "/tetris"
        };

        navigate(routes[game.title] || "/");
    };

    return (
        <div id="recently-played" className="glass-panel border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                        <FaHistory size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-gaming text-white tracking-wide">Recently Played</h2>
                        <p className="text-xs text-gray-400">Jump right back into your active arcade sessions</p>
                    </div>
                </div>
                {recentGames.length > 0 && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {recentGames.length} active
                    </span>
                )}
            </div>

            {recentGames.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/40 border border-purple-500/20 text-center relative z-10 space-y-3">
                    <div className="text-4xl">🕹️</div>
                    <h3 className="font-gaming text-base font-bold text-purple-200">No Recent Play Sessions Yet</h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Launch any game from the library below, and your recently played sessions will automatically be tracked here for instant resume!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {recentGames.slice(0, 3).map((game) => (
                        <div
                            key={game.id}
                            onClick={() => handleGameClick(game)}
                            className="cursor-pointer transform hover:scale-[1.02] transition-transform duration-300"
                        >
                            <GameCard 
                                title={game.title}
                                badge={`Played: ${new Date(game.lastPlayed).toLocaleDateString()}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentlyPlayed;