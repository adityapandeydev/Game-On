import React from "react";

interface GameCardProps {
    title: string;
}

interface MediaItem {
    type: "gif" | "video";
    src: string;
}

const GameCard: React.FC<GameCardProps> = ({ title }) => {
    const mediaMap: Record<string, MediaItem> = {
        "Tic-Tac-Toe": { type: "gif", src: "/Tic Tac Toe.gif" },
        "Guess My Number": { type: "video", src: "/GuessMyNumber1.mp4" },
        "Connect 4": { type: "video", src: "/connect.mp4" },
        "Pig Game": { type: "video", src: "/piggame.mp4" },
        "Quantum Guess": { type: "video", src: "/Math Quiz.mp4"},
        "Geo Quest": { type: "video", src: "/CapitalCities.mp4" },
        "TypeStorm": { type: "gif", src: "/Typing.gif" },
        "Sliding Puzzle": { type: "video", src: "/SlidingPuzzle.mp4" },
        "Tetris": { type: "video", src: "/tetris.mp4" },
    };

    const media = mediaMap[title];

    const renderMedia = () => {
        if (!media) {
            return (
                <div className="flex items-center justify-center w-full h-full text-3xl bg-cardBg">
                    🎮
                </div>
            );
        }

        return media.type === "gif" ? (
            <img
                src={media.src}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
            />
        ) : (
            <video
                src={media.src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />
        );
    };

    return (
        <div className="relative w-full h-80 bg-cardBg rounded shadow overflow-hidden hover:shadow-lg transition-shadow">
            {renderMedia()}
            <h2 className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-lg font-bold text-center py-1">
                {title}
            </h2>
        </div>
    );
};

export default GameCard;
