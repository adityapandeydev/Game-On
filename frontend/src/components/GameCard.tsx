import React from "react";

interface GameCardProps {
    title: string;
}

const GameCard: React.FC<GameCardProps> = ({ title }) => {
    // Mapping game titles to media (GIFs or videos)
    const mediaMap: { [key: string]: { type: "gif" | "video"; src: string } } = {
        "Tic-Tac-Toe": { type: "gif", src: "/Tic Tac Toe.gif" },
        "Guess My Number": { type: "video", src: "/GuessMyNumber1.mp4" }, // Add the MP4 path here
    };

    const media = mediaMap[title];

    return (
        <div className="relative w-full h-80 bg-cardBg rounded shadow overflow-hidden hover:shadow-lg transition-shadow">
            {media ? (
                media.type === "gif" ? (
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
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )
            ) : (
                <div className="flex items-center justify-center w-full h-full text-3xl bg-cardBg">
                    🎮
                </div>
            )}
            <h2 className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-lg font-bold text-center py-1">
                {title}
            </h2>
        </div>
    );
};

export default GameCard;
