import React, { useState } from 'react';
import GlobalLeaderboard from './GlobalLeaderboard';
import Leaderboard from './Leaderboard';

const LeaderboardPage: React.FC = () => {
    const [selectedGame, setSelectedGame] = useState<string>('global');

    const games = [
        { id: 'tictactoe', name: 'Tic Tac Toe' },
        { id: 'connect4', name: 'Connect 4' },
        { id: 'guess-number', name: 'Guess My Number' },
        { id: 'pig-game', name: 'Pig Game' },
        { id: 'math-quiz', name: 'Quantum Guess' },
        { id: 'capital-cities', name: 'Geo Quest' },
        { id: 'typing-test', name: 'TypeStorm' },
        { id: 'sliding-puzzle', name: 'Sliding Puzzle' },
        { id: 'tetris', name: 'Tetris' }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                    Game On Leaderboards
                </h1>
                <p className="text-gray-400">Compete. Conquer. Climb.</p>
            </div>

            {/* Game Selection */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                    <button
                        onClick={() => setSelectedGame('global')}
                        className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                            selectedGame === 'global'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        Global Rankings
                    </button>
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => setSelectedGame(game.id)}
                            className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                                selectedGame === game.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            {game.name}
                        </button>
                    ))}
                </div>

                {/* Leaderboard Display */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold">
                            {selectedGame === 'global' 
                                ? 'Global Rankings' 
                                : games.find(g => g.id === selectedGame)?.name || ''} Leaderboard
                        </h2>
                        <div className="flex gap-4">
                            <span className="text-purple-400">
                                <span className="text-gray-400">Updated</span> Live
                            </span>
                        </div>
                    </div>

                    {selectedGame === 'global' ? (
                        <GlobalLeaderboard />
                    ) : (
                        <Leaderboard gameId={selectedGame} refreshTrigger={0} />
                    )}
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-gray-800 rounded-xl p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">Total Players</h3>
                    <p className="text-3xl text-purple-400">1,234</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">Games Played</h3>
                    <p className="text-3xl text-purple-400">45,678</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 text-center">
                    <h3 className="text-xl font-bold mb-2">Active Players</h3>
                    <p className="text-3xl text-purple-400">789</p>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage; 