import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

interface Review {
    _id: string;
    username: string;
    reviewText: string;
    starRating: number;
    gameId?: string;
    reviewType: 'game' | 'website';
    createdAt: string;
}

interface GameOption {
    id: string;
    name: string;
}

const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [selectedGame, setSelectedGame] = useState<string>('website');
    const [hasReviewed, setHasReviewed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoggedIn } = useAuth();

    const games: GameOption[] = [
        { id: 'website', name: 'Overall Website' },
        { id: 'tictactoe', name: 'Tic Tac Toe' },
        { id: 'connect4', name: 'Connect 4' },
        { id: 'guess-number', name: 'Guess My Number' },
        { id: 'pig-game', name: 'Pig Game' },
        { id: 'math-quiz', name: 'Quantum Guess' },
        { id: 'capital-cities', name: 'Geo Quest' },
        { id: 'typing-test', name: 'TypeStorm' },
        { id: 'sliding-puzzle', name: 'Sliding Puzzle' },
        { id: 'tetris', name: 'Tetris' }
    ];

    useEffect(() => {
        fetchReviews();
    }, [selectedGame]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const endpoint = selectedGame === 'website' 
                ? '/api/reviews/website'
                : `/api/reviews/game/${selectedGame}`;

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            
            const data = await response.json();
            setReviews(data.reviews);
            
            if (isLoggedIn) {
                checkUserReview();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading reviews');
        } finally {
            setLoading(false);
        }
    };

    const checkUserReview = async () => {
        try {
            const response = await fetch(`/api/reviews/check-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({
                    gameId: selectedGame,
                    reviewType: selectedGame === 'website' ? 'website' : 'game'
                })
            });
            const data = await response.json();
            setHasReviewed(data.hasReviewed);
        } catch (error) {
            console.error('Error checking review status:', error);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setError('Please log in to submit a review');
            return;
        }

        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({
                    gameId: selectedGame === 'website' ? undefined : selectedGame,
                    reviewText,
                    reviewType: selectedGame === 'website' ? 'website' : 'game'
                })
            });

            if (!response.ok) throw new Error('Failed to submit review');

            setReviewText('');
            setHasReviewed(true);
            fetchReviews();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error submitting review');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                    Game Reviews
                </h1>
                <p className="text-gray-400">Share your gaming experience</p>
            </div>

            {/* Game Selection */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-wrap gap-4 justify-center">
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => setSelectedGame(game.id)}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                                selectedGame === game.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            {game.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Review Form */}
            {isLoggedIn && !hasReviewed && (
                <form onSubmit={handleSubmitReview} className="max-w-2xl mx-auto mb-12">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Write a Review</h2>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share your thoughts..."
                            className="w-full bg-gray-700 text-white rounded-lg p-4 mb-4 min-h-[120px]"
                            required
                            minLength={10}
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Submit Review
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews Display */}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">
                    {selectedGame === 'website' ? 'Website Reviews' : `${games.find(g => g.id === selectedGame)?.name} Reviews`}
                </h2>
                
                {loading ? (
                    <div className="text-center">Loading reviews...</div>
                ) : error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center text-gray-400">No reviews yet. Be the first to review!</div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review._id} className="bg-gray-800 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{review.username}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-gray-300 mb-4">{review.reviewText}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsPage; 