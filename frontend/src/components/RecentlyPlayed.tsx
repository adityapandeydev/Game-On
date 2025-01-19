// RecentlyPlayed.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHistory } from 'react-icons/fa';
import GameCard from './GameCard';
import useLocalStorage from '../hooks/useLocalStorage';

interface RecentGame {
    id: string;
    title: string;
    path: string;
    lastPlayed: Date;
}

const MAX_RECENT_GAMES = 3;

const RecentlyPlayed: React.FC = () => {
    const navigate = useNavigate();
    const [recentGames, setRecentGames] = useLocalStorage<RecentGame[]>('recentlyPlayed', []);

    const handleGameClick = (game: RecentGame) => {
        const routes: { [key: string]: string } = {
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
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
                <FaHistory size={24} className="text-purple-500" />
                <h2 className="text-2xl font-bold">Recently Played</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentGames.map((game, index) => (
                    <div
                        key={game.id}
                        onClick={() => handleGameClick(game)}
                        className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
                    >
                        <GameCard 
                            title={game.title}
                            badge={`Last played: ${new Date(game.lastPlayed).toLocaleDateString()}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyPlayed;