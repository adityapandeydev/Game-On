import React from "react";

interface GameCardProps {
    title: string;
}

const GameCard: React.FC<GameCardProps> = ({ title }) => {
    return (
        <div className="p-4 bg-cardBg rounded shadow hover:shadow-lg transition-shadow">
            <div className="text-center text-3xl mb-2">🎮</div>
            <h2 className="text-center text-lg font-bold">{title}</h2>
        </div>
    );
};

export default GameCard;
