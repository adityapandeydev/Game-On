import { GameScore, UserGameStats, GameResult } from '../types/game';

export class ScoreService {
    private static readonly SCORING_RULES = {
        tictactoe: {
            win: 20,
            draw: 10,
            lose: 0
        },
        connect4: {
            win: 20,
            lose: 0
        },
        guessmynumber: {
            win: (attempts: number) => Math.max(20 - attempts, 1),
            lose: 0
        },
        piggame: {
            win: (streak: number) => {
                const baseScore = 20;
                const multiplier = 1 + ((streak - 1) * 0.1);
                return Math.round(baseScore * multiplier);
            },
            lose: 0
        }
    };

    static calculateScore(gameId: string, result: GameResult, params?: { streak?: number }): number {
        const rules = this.SCORING_RULES[gameId as keyof typeof this.SCORING_RULES];
        const rule = rules[result as keyof typeof rules];
        
        if (typeof rule === 'function') {
            return rule(params?.streak ?? 1);
        }
        return rule;
    }

    static updateStreak(previousResult: GameResult, currentStreak: number): number {
        if (previousResult === 'win') {
            return currentStreak + 1;
        }
        return 1; // Reset streak on draw or lose
    }

    static async saveScore(gameId: string, userId: string, result: GameResult): Promise<void> {
        try {
            const stats = await this.getUserGameStats(gameId, userId);
            
            if (result === 'win') {
                const newStreak = stats.currentStreak + 1;
                const scoreWithStreak = this.calculateScore(gameId, result, { streak: newStreak });
                
                console.log('Saving win:', {
                    streak: newStreak,
                    score: scoreWithStreak
                });

                await this.saveGameScore({
                    gameId,
                    userId,
                    score: scoreWithStreak,
                    streak: newStreak,
                    timestamp: new Date()
                });

            } else {
                // On loss, save score 0 and reset streak
                await this.saveGameScore({
                    gameId,
                    userId,
                    score: 0,
                    streak: 0,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error saving score:', error);
            throw error;
        }
    }

    // Implement these methods based on your backend/database setup
    private static async getUserGameStats(gameId: string, userId: string): Promise<UserGameStats> {
        const response = await fetch(`http://localhost:5000/api/leaderboard/game/${gameId}/stats/${userId}`);
        if (!response.ok) {
            return {
                userId,
                gameId,
                highestScore: 0,
                currentStreak: 0,
                totalGamesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0
            };
        }
        return response.json();
    }

    private static getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token ?? ''
        };
    }

    private static async saveGameScore(score: GameScore): Promise<void> {
        const response = await fetch('http://localhost:5000/api/leaderboard/score', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(score)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save score');
        }
    }
}