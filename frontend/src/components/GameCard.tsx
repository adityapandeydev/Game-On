import React from "react";

export interface GameCardProps {
    title: string;
    badge?: string;
    subtitle?: string;
}

interface MediaItem {
    type: "gif" | "video";
    src: string;
}

const mediaMap: Record<string, MediaItem> = {
    "Tic-Tac-Toe": { type: "gif", src: "/Tic Tac Toe.gif" },
    "Guess My Number": { type: "video", src: "/GuessMyNumber1.mp4" },
    "Connect 4": { type: "video", src: "/connect.mp4" },
    "Pig Game": { type: "video", src: "/piggame.mp4" },
    "Quantum Guess": { type: "video", src: "/Math Quiz.mp4" },
    "Geo Quest": { type: "video", src: "/CapitalCities.mp4" },
    "TypeStorm": { type: "gif", src: "/typing2.gif" },
    "Tetris": { type: "gif", src: "/tetris1.gif" },
    "Sliding Puzzle": { type: "gif", src: "/sliding puzzle.gif" },
};

const GameCard: React.FC<GameCardProps> = ({ title, badge, subtitle }) => {
    const media = mediaMap[title];

    const renderMedia = () => {
        if (!media) {
            return (
                <div className="flex items-center justify-center w-full h-full text-5xl bg-gradient-to-br from-purple-900/40 to-cyan-900/30">
                    🎮
                </div>
            );
        }

        return media.type === "gif" ? (
            <img
                src={media.src}
                alt={title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        ) : (
            <video
                src={media.src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
        );
    };

    return (
        <div className="group relative w-full h-80 rounded-2xl overflow-hidden bg-gray-900/80 border border-purple-500/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/60 transition-all duration-300">
            {renderMedia()}
            
            {/* Ambient vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Badge if present */}
            {badge && (
                <div className="absolute top-3 right-3 z-10">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-600/90 text-white backdrop-blur-md border border-purple-400/40 shadow-lg">
                        {badge}
                    </span>
                </div>
            )}

            {/* Bottom Card Title Info */}
            <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col items-center justify-end text-center bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent">
                <h2 className="text-xl font-bold font-gaming tracking-wide text-white drop-shadow group-hover:text-purple-300 transition-colors">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                )}
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-x-0 group-hover:scale-x-100" />
            </div>
        </div>
    );
};

export default GameCard;