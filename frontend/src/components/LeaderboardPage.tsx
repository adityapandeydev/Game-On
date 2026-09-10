import React, { useState } from 'react';
import Leaderboard from './Leaderboard';
import { motion } from 'framer-motion';
import { FaTrophy } from 'react-icons/fa';

const LeaderboardPage: React.FC = () => {
    const [selectedGame, setSelectedGame] = useState('global');

    const games = [
        { id: 'global', name: 'Global Hall of Fame' },
        { id: 'tictactoe', name: 'Tic Tac Toe' },
        { id: 'connect4', name: 'Connect 4' },
        { id: 'guessmynumber', name: 'Guess My Number' },
        { id: 'piggame', name: 'Pig Game' },
        { id: 'mathquiz', name: 'Quantum Guess' },
        { id: 'capitalcities', name: 'Geo Quest' },
        { id: 'typestorm', name: 'TypeStorm' },
        { id: 'slidingpuzzle', name: 'Sliding Puzzle' },
        { id: 'tetris', name: 'Tetris' }
    ];

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 py-12 text-white">
            <div className="max-w-5xl mx-auto">
                {/* Hero Header */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-4"
                    >
                        <FaTrophy className="text-yellow-400" /> Arcade Champions
                    </motion.div>
                    <motion.h1 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl sm:text-5xl font-extrabold font-gaming tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow"
                    >
                        LEADERBOARD
                    </motion.h1>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">
                        Compete, set records, and etch your name into Game-On history.
                    </p>
                </div>

                {/* Game Pill Selector */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 p-2 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-purple-500/20">
                    {games.map((game) => (
                        <motion.button
                            key={game.id}
                            onClick={() => setSelectedGame(game.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-gaming font-semibold transition-all duration-200 ${
                                selectedGame === game.id 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/40' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/80 border border-transparent'
                            }`}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            {game.name}
                        </motion.button>
                    ))}
                </div>

                {/* Dynamic Leaderboard Display */}
                <Leaderboard selectedGame={selectedGame} />
            </div>
        </div>
    );
};

export default LeaderboardPage;