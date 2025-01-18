export interface GameScore {
    gameId: string;
    userId: string;
    score: number;
    streak: number;
    timestamp: Date;
}

export interface UserGameStats {
    userId: string;
    gameId: string;
    highestScore: number;
    currentStreak: number;
    totalGamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    score: number;
    streak: number;
}

export interface GlobalLeaderboardEntry {
    userId: string;
    username: string;
    totalScore: number;
    gameScores: {
        [gameId: string]: number;
    };
}

export type GameResult = 'win' | 'draw' | 'lose'; 