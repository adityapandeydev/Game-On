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

    static async saveScore(gameId: string, userId: string, newScore: number): Promise<void> {
        try {
            // Only update the database if the new score is higher
            const response = await fetch('http://localhost:5000/api/leaderboard/submit', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    gameId,
                    userId,
                    score: newScore,
                    gameName: gameId
                })
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.msg?.includes('not higher')) {
                    console.log('Score not higher than previous best');
                    return;
                }
                throw new Error('Failed to save score');
            }
        } catch (error) {
            console.error('Error saving score:', error);
            throw error;
        }
    }

    private static getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'x-auth-token': token ?? ''
        };
    }
}