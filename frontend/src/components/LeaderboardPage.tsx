import React, { useState } from 'react';
import Leaderboard from './Leaderboard';
import { motion } from 'framer-motion';

const LeaderboardPage: React.FC = () => {
    const [selectedGame, setSelectedGame] = useState('tictactoe');

    const games = [
        { id: 'global', name: 'Global Rankings' },
        { id: 'tictactoe', name: 'Tic Tac Toe' },
        { id: 'connect4', name: 'Connect 4' },
        { id: 'guess-number', name: 'Guess My Number' },
        { id: 'pig-game', name: 'Pig Game' },
        { id: 'quantum-guess', name: 'Quantum Guess' },
        { id: 'geo-quest', name: 'Geo Quest' },
        { id: 'typestorm', name: 'TypeStorm' },
        { id: 'sliding-puzzle', name: 'Sliding Puzzle' },
        { id: 'tetris', name: 'Tetris' }
    ];

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-gaming text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
            >
                Leaderboard
            </motion.h1>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
                {games.map((game) => (
                    <motion.button
                        key={game.id}
                        onClick={() => setSelectedGame(game.id)}
                        className={`px-4 py-2 rounded-lg font-gaming transition-all duration-300
                            ${selectedGame === game.id 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {game.name}
                    </motion.button>
                ))}
            </div>

            <Leaderboard selectedGame={selectedGame} />
        </div>
    );
};

export default LeaderboardPage; 