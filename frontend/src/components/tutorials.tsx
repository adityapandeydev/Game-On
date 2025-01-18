import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface Tutorial {
    id: number;
    title: string;
    thumbnail: string;
    videoUrl: string;
    description: string;
}

const tutorials: Tutorial[] = [
    {
        id: 1,
        title: "Getting Started with Tic-Tac-Toe",
        thumbnail: "/thumbnails/tictactoe-tutorial.jpg",
        videoUrl: "/tutorials/tictactoe-guide.mp4",
        description: "Learn the basics of playing Tic-Tac-Toe and advanced strategies."
    },
    {
        id: 2,
        title: "Mastering Connect 4",
        thumbnail: "/thumbnails/connect4-tutorial.jpg",
        videoUrl: "/tutorials/connect4-guide.mp4",
        description: "Advanced techniques for Connect 4 victory."
    },
    {
        id: 3,
        title: "TypeStorm Mastery",
        thumbnail: "/thumbnails/typestorm-tutorial.jpg",
        videoUrl: "/tutorials/typestorm-guide.mp4",
        description: "Improve your typing speed and accuracy."
    },
    {
        id: 4,
        title: "Quantum Guess Guide",
        thumbnail: "/thumbnails/quantum-tutorial.jpg",
        videoUrl: "/tutorials/quantum-guide.mp4",
        description: "Master the math quiz challenges."
    },
    {
        id: 5,
        title: "Geo Quest Tips",
        thumbnail: "/thumbnails/geo-tutorial.jpg",
        videoUrl: "/tutorials/geo-guide.mp4",
        description: "Learn geography while having fun."
    },
    {
        id: 6,
        title: "Pig Game Strategy Guide",
        thumbnail: "/thumbnails/pig-tutorial.jpg",
        videoUrl: "/tutorials/pig-guide.mp4",
        description: "Master the art of risk management in Pig Game."
    },
    {
        id: 7,
        title: "Guess My Number Tips",
        thumbnail: "/thumbnails/guess-tutorial.jpg",
        videoUrl: "/tutorials/guess-guide.mp4",
        description: "Learn the optimal strategy for guessing numbers."
    },
    {
        id: 8,
        title: "Sliding Puzzle Techniques",
        thumbnail: "/thumbnails/sliding-tutorial.jpg",
        videoUrl: "/tutorials/sliding-guide.mp4",
        description: "Learn advanced techniques to solve sliding puzzles quickly."
    },
    {
        id: 9,
        title: "Tetris Pro Strategies",
        thumbnail: "/thumbnails/tetris-tutorial.jpg",
        videoUrl: "/tutorials/tetris-guide.mp4",
        description: "Master Tetris with professional techniques and strategies."
    }
];

const Tutorials: React.FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<Tutorial | null>(null);
    const [imageError, setImageError] = useState<{[key: number]: boolean}>({});

    const handleImageError = (tutorialId: number) => {
        setImageError(prev => ({...prev, [tutorialId]: true}));
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            {/* Header */}
            <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-gaming text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
            >
                Game Tutorials
            </motion.h1>

            {/* Tutorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map((tutorial) => (
                    <motion.div
                        key={tutorial.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                        className="relative cursor-pointer bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-purple-500/30 hover:border-purple-500"
                        onClick={() => setSelectedVideo(tutorial)}
                    >
                        {!imageError[tutorial.id] ? (
                            <img 
                                src={tutorial.thumbnail} 
                                alt={tutorial.title}
                                className="w-full h-48 object-cover"
                                onError={() => handleImageError(tutorial.id)}
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                                <span className="text-4xl">🎮</span>
                            </div>
                        )}
                        <div className="p-4">
                            <h3 className="text-xl font-gaming text-purple-400 mb-2">{tutorial.title}</h3>
                            <p className="text-gray-300 text-sm">{tutorial.description}</p>
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
                            Tutorial
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                >
                    <div className="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 text-white hover:text-purple-400 z-10"
                        >
                            <FaTimes size={24} />
                        </button>
                        <div className="p-4">
                            <h2 className="text-2xl font-gaming text-purple-400 mb-4">{selectedVideo.title}</h2>
                            <video
                                controls
                                className="w-full rounded-lg"
                                src={selectedVideo.videoUrl}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Tutorials;