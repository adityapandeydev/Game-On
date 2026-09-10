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
            if (!token) {
                setRecentGames(localRecentGames);
                return;
            }

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
            setRecentGames(localRecentGames);
        };

        fetchRecentGames();
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

    if (recentGames.length === 0) return null;

    return (
        <div id="recently-played" className="bg-gray-900/60 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <FaHistory size={20} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold font-gaming text-white">Recently Played</h2>
                    <p className="text-xs text-gray-400">Jump right back into your active arcade sessions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
    );
};

export default RecentlyPlayed;