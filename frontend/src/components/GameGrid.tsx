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
    const [textIndex, setTextIndex] = useState(0);
    const { searchTerm } = useSearch();
    const texts = [
        "Welcome to Game On",
        "Your ultimate gaming destination"
    ];

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

    const trendingGames = [
        { id: "t1", title: "Game 1" },
        { id: "t2", title: "Game 2" },
        { id: "t3", title: "Game 3" },
    ];

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

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % texts.length);
        }, 4000); // Change text every 4 seconds

        return () => clearInterval(interval);
    }, []);

    const welcomeText = "Welcome to Game On".split(' ').reduce((acc: string[], word) => {
        if (word === "Game") {
            acc.push("GAME ON");
        } else if (word !== "On") {
            acc.push(word.toUpperCase());
        }
        return acc;
    }, []);

    const destinationText = "Your ultimate gaming destination".toUpperCase().split(' ');

    const scrollToRecentlyPlayed = () => {
        const element = document.getElementById('recently-played');
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

    return (
        <div className="p-4 space-y-16 relative">
            {!searchTerm ? (
                // Show homepage content only when not searching
                <>
                    {/* Home Section with Video Background */}
                    <section id="home" className="relative h-[95vh] overflow-hidden rounded-2xl">
                        {/* Video Background */}
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            style={{ filter: 'brightness(0.7)' }}
                        >
                            <source src="/videos/intro.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Text Overlay */}
                        <div className="relative z-0 h-full flex flex-col items-start justify-center pl-20 pt-32">
                            <div className="text-left space-y-8">
                                <div className="flex flex-wrap gap-4">
                                    {welcomeText.map((word, index) => (
                                        <motion.span
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                delay: index * 0.5,
                                                repeat: Infinity,
                                                repeatDelay: 6
                                            }}
                                            className={`font-gaming text-6xl text-white 
                                                ${word === "GAME ON" ? 
                                                "font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text" : ""}`}
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </div>
                                
                                <div className="flex flex-wrap gap-4">
                                    {destinationText.map((word, index) => (
                                        <motion.span
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                delay: welcomeText.length * 0.5 + index * 0.5,
                                                repeat: Infinity,
                                                repeatDelay: 6
                                            }}
                                            className="font-cyber text-3xl bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text"
                                        >
                                            {word}
                                        </motion.span>
                                    ))}
                                </div>

                                {/* Transparent Get Started Button */}
                                <motion.button
                                    onClick={scrollToRecentlyPlayed}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 4 }}
                                    className="mt-8 px-8 py-4 bg-transparent hover:bg-purple-500/20
                                             text-white rounded-lg
                                             transform hover:scale-110 transition-all duration-300
                                             font-gaming flex items-center gap-3
                                             border-2 border-purple-400"
                                    style={{
                                        boxShadow: '0 0 15px rgba(147, 51, 234, 0.3)'
                                    }}
                                >
                                    Get Started
                                    <motion.div
                                        animate={{ y: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <FaArrowUp className="transform rotate-180 text-xl" />
                                    </motion.div>
                                </motion.button>
                            </div>
                        </div>
                    </section>

                    {/* Recently Played Section */}
                    <section id="recently-played" className="scroll-mt-16">
                        <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
                        <RecentlyPlayed />
                    </section>

                    {/* Trending Section */}
                    <section id="trending" className="scroll-mt-16">
                        <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
                        <TrendingGames />
                    </section>

                    {/* Genre Sections */}
                    {genres.map((genre) => (
                        <section 
                            key={genre.name} 
                            id={genre.name.toLowerCase()}
                            className="scroll-mt-16"
                        >
                            <h2 className="text-2xl font-bold mb-4">{genre.name}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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