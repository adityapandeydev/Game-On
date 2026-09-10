import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "./GameCard";
import TrendingGames from './TrendingGames';
import RecentlyPlayed from './RecentlyPlayed';
import { FaArrowUp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSearch } from '../context/SearchContext';

interface GameGridProps {
    isLoggedIn: boolean;
}

const GameGrid: React.FC<GameGridProps> = ({ isLoggedIn }) => {
    const navigate = useNavigate();
    const [showScrollButton, setShowScrollButton] = useState(false);
    const { searchTerm } = useSearch();

    // Show button when page is scrolled up 300px
    useEffect(() => {
        const checkScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };

        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const genres = [
        {
            name: "Puzzle",
            games: [
                { id: 1, title: "Tic-Tac-Toe" },
                { id: 2, title: "Tetris" },
                { id: 3, title: "Sliding Puzzle" },
            ],
        },
        {
            name: "Strategy",
            games: [
                { id: 4, title: "Connect 4" },
                { id: 5, title: "Pig Game" },
                { id: 6, title: "Guess My Number" },
            ],
        },
        {
            name: "Education",
            games: [
                { id: 7, title: "TypeStorm" },
                { id: 8, title: "Quantum Guess" },
                { id: 9, title: "Geo Quest" },
            ],
        },
    ];

    const navigateToGame = (gameTitle: string) => {
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
        
        navigate(routes[gameTitle] || "/");
    };

    const handleCardClick = (gameTitle: string) => {
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }
        navigateToGame(gameTitle);
    };

    const scrollToTrending = () => {
        const element = document.getElementById('trending');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Filter function for games
    const filterGames = (games: Array<{ id: number, title: string }>) => {
        return games.filter(game => 
            game.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Filter genres that have matching games
    const filteredGenres = genres.map(genre => ({
        ...genre,
        games: filterGames(genre.games)
    })).filter(genre => genre.games.length > 0);

    const genreMeta: Record<string, { icon: string; desc: string }> = {
        "Puzzle": { icon: "🧩", desc: "Sharpen your pattern recognition and spatial reasoning." },
        "Strategy": { icon: "⚡", desc: "Outsmart tactical bots and calculate every winning move." },
        "Education": { icon: "🧠", desc: "Boost mental agility, math computation, and world trivia." }
    };

    const scrollToSection = (sectionId: string) => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="p-4 space-y-12 relative">
            {!searchTerm ? (
                // Show homepage content only when not searching
                <>
                    {/* Home Section with Video Background */}
                    <section id="home" className="relative min-h-[85vh] lg:h-[90vh] overflow-hidden rounded-3xl border border-purple-500/20 shadow-2xl flex flex-col justify-between">
                        {/* Video Background */}
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute top-0 left-0 w-full h-full object-cover scale-105"
                            style={{ filter: 'brightness(0.6) contrast(1.1)' }}
                        >
                            <source src="/videos/intro.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Ambient gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/40 pointer-events-none" />

                        {/* Text Overlay */}
                        <div className="relative z-10 h-full flex flex-col items-start justify-center p-8 sm:p-14 lg:p-20 max-w-4xl space-y-8 my-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-1" />
                                Next-Gen Web Arcade Engine
                            </div>

                            <div className="space-y-4">
                                <h1 className="font-gaming text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-wide">
                                    WELCOME TO <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                        GAME ON
                                    </span>
                                </h1>
                                <p className="font-sans text-lg sm:text-2xl text-gray-300 font-medium max-w-xl leading-relaxed">
                                    Instant-play retro classics, competitive puzzles, and real-time global leaderboards.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <button
                                    onClick={scrollToTrending}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-gaming text-base font-bold shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8)] transform hover:-translate-y-0.5 transition-all flex items-center gap-3"
                                >
                                    <span>Explore Games</span>
                                    <FaArrowUp className="transform rotate-180 text-sm" />
                                </button>
                                
                                {!isLoggedIn && (
                                    <button
                                        onClick={() => navigate("/signup")}
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-gaming text-base font-bold border border-white/20 backdrop-blur-md hover:border-purple-400/60 transition-all"
                                    >
                                        Create Free Account
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Arcade Highlights Ribbon */}
                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-black/40 backdrop-blur-xl border-t border-purple-500/20 text-center">
                            <div className="p-2">
                                <p className="text-xs text-purple-300 uppercase tracking-widest font-semibold">Library</p>
                                <p className="text-lg sm:text-xl font-bold font-gaming text-white">9 Arcade Hits</p>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-cyan-300 uppercase tracking-widest font-semibold">Engine</p>
                                <p className="text-lg sm:text-xl font-bold font-gaming text-white">100% Solvable</p>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-pink-300 uppercase tracking-widest font-semibold">Leaderboard</p>
                                <p className="text-lg sm:text-xl font-bold font-gaming text-white">Real-Time Sync</p>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold">Latency</p>
                                <p className="text-lg sm:text-xl font-bold font-gaming text-white">Zero Delay</p>
                            </div>
                        </div>
                    </section>

                    {/* Quick Category Jump Bar */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">Jump to:</span>
                        <button
                            onClick={() => scrollToSection('trending')}
                            className="px-4 py-2 rounded-xl bg-gray-900/80 border border-purple-500/20 text-gray-300 hover:text-white hover:border-purple-400 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            <span>🔥</span> Top Games
                        </button>
                        <button
                            onClick={() => scrollToSection('puzzle')}
                            className="px-4 py-2 rounded-xl bg-gray-900/80 border border-purple-500/20 text-gray-300 hover:text-white hover:border-purple-400 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            <span>🧩</span> Puzzle
                        </button>
                        <button
                            onClick={() => scrollToSection('strategy')}
                            className="px-4 py-2 rounded-xl bg-gray-900/80 border border-purple-500/20 text-gray-300 hover:text-white hover:border-purple-400 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            <span>⚡</span> Strategy
                        </button>
                        <button
                            onClick={() => scrollToSection('education')}
                            className="px-4 py-2 rounded-xl bg-gray-900/80 border border-purple-500/20 text-gray-300 hover:text-white hover:border-purple-400 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2"
                        >
                            <span>🧠</span> Education
                        </button>
                    </div>

                    {/* Recently Played Section */}
                    <section id="recently-played" className="scroll-mt-20">
                        <RecentlyPlayed />
                    </section>

                    {/* Trending Section */}
                    <section id="trending" className="scroll-mt-20">
                        <TrendingGames />
                    </section>

                    {/* Genre Sections */}
                    {genres.map((genre) => (
                        <section 
                            key={genre.name} 
                            id={genre.name.toLowerCase()}
                            className="scroll-mt-20 space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-purple-500/20 pb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{genreMeta[genre.name]?.icon || "🎮"}</span>
                                        <h2 className="text-3xl font-extrabold font-gaming text-white tracking-wide">
                                            {genre.name} Games
                                        </h2>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1 pl-1">
                                        {genreMeta[genre.name]?.desc || "Challenge yourself with engaging gameplay."}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 w-fit">
                                    {genre.games.length} titles
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {genre.games.map((game) => (
                                    <button
                                        key={game.id}
                                        className="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                                        onClick={() => handleCardClick(game.title)}
                                        aria-label={`Play ${game.title}`}
                                    >
                                        <GameCard title={game.title} />
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </>
            ) : (
                // Search Results View
                <div className="mt-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-3xl font-bold mb-8 text-purple-400">
                            Search Results for "{searchTerm}"
                        </h2>
                        {filteredGenres.length > 0 ? (
                            filteredGenres.map((genre) => (
                                <section 
                                    key={genre.name} 
                                    id={genre.name.toLowerCase()}
                                    className="mb-12"
                                >
                                    <h3 className="text-xl font-bold mb-6 text-gray-300">{genre.name}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {genre.games.map((game) => (
                                            <motion.div
                                                key={game.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <button
                                                    className="w-full text-left bg-transparent border-0 p-0 m-0 cursor-pointer"
                                                    onClick={() => handleCardClick(game.title)}
                                                    aria-label={`Play ${game.title}`}
                                                >
                                                    <GameCard title={game.title} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-gray-400 mt-12"
                            >
                                <p className="text-xl mb-4">No games found matching "{searchTerm}"</p>
                                <p className="text-sm">Try a different search term or browse our categories below</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Move to Top Button */}
            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-500 
                             text-white p-4 rounded-full shadow-lg 
                             transform hover:scale-110 transition-all duration-300
                             border-2 border-purple-400
                             animate-bounce z-40"
                    style={{
                        boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)'
                    }}
                    aria-label="Scroll to top"
                >
                    <FaArrowUp className="text-xl" />
                </button>
            )}
        </div>
    );
};

export default GameGrid;