import React, { useState } from "react";
import TicTacToe from "./TicTacToe";
import Connect4 from "./Connect4";
import GuessMyNumber from "./GuessMyNumber"; // Import Guess My Number component
import GameCard from "./GameCard";
import PigGame from "./PigGame";

const GameGrid: React.FC = () => {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

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
                { id: 2, title: "2048" },
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
                { id: 7, title: "Guess My Number 2" },
                { id: 8, title: "Math Quiz" },
                { id: 9, title: "Guess the Country" },
            ],
        },
    ];

    const handleCardClick = (gameTitle: string) => {
        console.log(`Card Clicked: ${gameTitle}`);
        if (gameTitle === "Tic-Tac-Toe") {
            setSelectedGame("TicTacToe");
        } else if (gameTitle === "Connect 4") {
            setSelectedGame("Connect4");
        } else if (gameTitle === "Guess My Number") {
            setSelectedGame("GuessMyNumber");
        } else if (gameTitle === "Pig Game") {
            setSelectedGame("PigGame");
        }
    };

    return (
        <div className="p-4 bg-gray-900">
            {/* Show selected game */}
            {selectedGame === "TicTacToe" ? (
                <TicTacToe />
            ) : selectedGame === "Connect4" ? (
                <Connect4 />
            ) : selectedGame === "GuessMyNumber" ? (
                <GuessMyNumber />
            ) : selectedGame === "PigGame" ? (
                <PigGame />
            ) : (
                <>
                    {/* Trending Now Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-900">
                            {trendingGames.map((game) => (
                                <GameCard key={game.id} title={game.title} />
                            ))}
                        </div>
                    </div>

                    {/* Genre Sections */}
                    {genres.map((genre) => (
                        <div key={genre.name} className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">{genre.name}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {genre.games.map((game) => (
                                    <div
                                        key={game.id}
                                        className="cursor-pointer"
                                        onClick={() => handleCardClick(game.title)}
                                    >
                                        <GameCard title={game.title} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default GameGrid;
