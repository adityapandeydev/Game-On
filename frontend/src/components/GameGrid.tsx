import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameCard from "./GameCard";

interface GameGridProps {
    isLoggedIn: boolean; // Declare the prop here
}

const GameGrid: React.FC<GameGridProps> = ({ isLoggedIn }) => {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const navigate = useNavigate();

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
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            setSelectedGame(gameTitle);
        }
    };

    return (
        <div className="p-4">
            {selectedGame === "TicTacToe" ? (
                <div>Tic Tac Toe Game</div>
            ) : selectedGame === "Connect4" ? (
                <div>Connect 4 Game</div>
            ) : selectedGame === "GuessMyNumber" ? (
                <div>Guess My Number Game</div>
            ) : (
                <>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Trending Now</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendingGames.map((game) => (
                                <GameCard key={game.id} title={game.title} />
                            ))}
                        </div>
                    </div>

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
