import type { GameResult, UserGameStats } from '../types/game';

export class ScoreService {
    private static readonly SCORING_RULES: Record<string, Record<GameResult, number | ((param: number) => number)>> = {
        tictactoe: {
            win: (streak: number) => Math.round(20 * (1 + (streak - 1) * 0.1)),
            draw: 10,
            lose: 0
        },
        connect4: {
            win: 20,
            draw: 10,
            lose: 0
        },
        guessmynumber: {
            win: (attempts: number) => Math.max(20 - attempts, 1),
            draw: 5,
            lose: 0
        },
        piggame: {
            win: (streak: number) => Math.round(20 * (1 + (streak - 1) * 0.1)),
            draw: 10,
            lose: 0
        },
        mathquiz: {
            win: 20,
            draw: 10,
            lose: 0
        },
        capitalcities: {
            win: 20,
            draw: 10,
            lose: 0
        },
        typestorm: {
            win: 20,
            draw: 10,
            lose: 0
        },
        slidingpuzzle: {
            win: 20,
            draw: 10,
            lose: 0
        },
        tetris: {
            win: 20,
            draw: 10,
            lose: 0
        }
    };

    static calculateScore(gameId: string, result: GameResult, params?: { streak?: number; attempts?: number }): number {
        const rules = this.SCORING_RULES[gameId] || this.SCORING_RULES['tictactoe'];
        const rule = rules[result];
        
        if (typeof rule === 'function') {
            return rule(params?.streak ?? params?.attempts ?? 1);
        }
        return rule ?? 0;
    }

    static async saveScore(
        gameId: string, 
        userId: string, 
        scoreOrResult: number | GameResult,
        gameName?: string
    ): Promise<void> {
        try {
            let numericScore: number;
            if (typeof scoreOrResult === 'number') {
                numericScore = scoreOrResult;
            } else {
                numericScore = this.calculateScore(gameId, scoreOrResult);
            }

            await fetch('/api/leaderboard/submit', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    gameId,
                    userId,
                    score: numericScore,
                    gameName: gameName || gameId
                })
            });

            // Automatically record in recently played
            await this.trackGamePlay(gameId, gameName || gameId);
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    static async trackGamePlay(gameId: string, gameName: string): Promise<void> {
        try {
            // Update localStorage immediately
            const raw = localStorage.getItem('recentlyPlayed');
            let list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            list = list.filter((g: { id?: string; title?: string }) => g.id !== gameId && g.title !== gameName);
            list.unshift({
                id: gameId,
                title: gameName,
                lastPlayed: new Date().toISOString()
            });
            localStorage.setItem('recentlyPlayed', JSON.stringify(list.slice(0, 6)));
            window.dispatchEvent(new Event('recentlyPlayedUpdated'));

            // Sync with backend if logged in
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/recently-played/track', {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ gameId, gameName })
                });
            }
        } catch (e) {
            console.warn('Could not track game play:', e);
        }
    }

    static async getUserGameStats(gameId: string, _userId?: string): Promise<UserGameStats> {
        try {
            const response = await fetch(`/api/gamestats/${gameId}`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    userId: data.userId || '',
                    gameId: gameId,
                    currentScore: data.currentScore || 0,
                    currentStreak: data.currentStreak || 0,
                    highestScore: data.highestScore || data.currentScore || 0,
                    totalGamesPlayed: data.totalGamesPlayed || 0,
                    wins: data.wins || 0,
                    draws: data.draws || 0,
                    losses: data.losses || 0
                };
            }
        } catch (error) {
            console.error('Failed to get user game stats:', error);
        }

        return {
            userId: _userId || '',
            gameId,
            currentScore: 0,
            currentStreak: 0,
            highestScore: 0,
            totalGamesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0
        };
    }

    static async updateLeaderboard(gameId: string, userId: string, score: number): Promise<void> {
        return this.saveScore(gameId, userId, score);
    }

    private static getHeaders(): Record<string, string> {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['x-auth-token'] = token;
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
}