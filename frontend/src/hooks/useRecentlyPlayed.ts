// import { useState, useEffect } from 'react';

// export interface RecentGame {
//     id: string;
//     name: string;
//     timestamp: number;
// }

// const STORAGE_KEY = 'recentlyPlayed';
// const MAX_RECENT_GAMES = 3;

// export const useRecentlyPlayed = () => {
//     const [recentGames, setRecentGames] = useState<RecentGame[]>(() => {
//         const saved = localStorage.getItem(STORAGE_KEY);
//         return saved ? JSON.parse(saved) : [];
//     });

//     useEffect(() => {
//         localStorage.setItem(STORAGE_KEY, JSON.stringify(recentGames));
//     }, [recentGames]);

//     const addRecentGame = (gameId: string, gameName: string) => {
//         setRecentGames(prev => {
//             // Remove existing entry of the same game
//             const filtered = prev.filter(game => game.id !== gameId);
            
//             // Add new game at the beginning
//             const newGame = {
//                 id: gameId,
//                 name: gameName,
//                 timestamp: Date.now()
//             };
            
//             // Keep only the last MAX_RECENT_GAMES
//             return [newGame, ...filtered].slice(0, MAX_RECENT_GAMES);
//         });
//     };

//     return { recentGames, addRecentGame };
// }; 