import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaComments } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface Review {
    _id?: string;
    id?: string;
    username?: string;
    userId?: {
        name?: string;
    } | string;
    comment?: string;
    reviewText?: string;
    rating?: number;
    starRating?: number;
    gameId?: string;
    createdAt?: string;
    timestamp?: string;
}

interface GameOption {
    id: string;
    name: string;
}

const games: GameOption[] = [
    { id: 'website', name: 'Overall Platform' },
    { id: 'tictactoe', name: 'Tic Tac Toe' },
    { id: 'connect4', name: 'Connect 4' },
    { id: 'guessmynumber', name: 'Guess My Number' },
    { id: 'piggame', name: 'Pig Game' },
    { id: 'mathquiz', name: 'Quantum Guess' },
    { id: 'capitalcities', name: 'Geo Quest' },
    { id: 'typestorm', name: 'TypeStorm' },
    { id: 'slidingpuzzle', name: 'Sliding Puzzle' },
    { id: 'tetris', name: 'Tetris' }
];

const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState<number>(5);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [selectedGame, setSelectedGame] = useState<string>('website');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        let isMounted = true;

        const fetchReviews = async () => {
            try {
                setLoading(true);
                setError(null);
                const endpoint = selectedGame === 'website' 
                    ? '/api/reviews'
                    : `/api/reviews/game/${selectedGame}`;

                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error('Failed to fetch reviews');
                }
                
                const data = await response.json();
                if (isMounted) {
                    const rawReviews = Array.isArray(data) ? data : data.reviews || [];
                    setReviews(rawReviews);
                }
            } catch (err) {
                console.warn('Reviews fetch fallback:', err);
                if (isMounted) {
                    setReviews([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchReviews();

        return () => {
            isMounted = false;
        };
    }, [selectedGame]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setError('Please log in to submit a review');
            return;
        }

        if (!reviewText.trim()) return;

        try {
            setSubmitting(true);
            setError(null);
            const token = localStorage.getItem('token');
            const selectedGameObj = games.find(g => g.id === selectedGame);

            const response = await fetch('/api/reviews/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token || '',
                    'Authorization': `Bearer ${token || ''}`
                },
                body: JSON.stringify({
                    gameId: selectedGame,
                    gameName: selectedGameObj?.name || 'Game-On Arcade',
                    rating,
                    comment: reviewText
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.msg || data.message || 'Failed to submit review');
            }

            const newReview: Review = {
                id: Date.now().toString(),
                username: user?.name || 'You',
                comment: reviewText,
                rating,
                timestamp: new Date().toISOString()
            };

            setReviews(prev => [newReview, ...prev]);
            setReviewText('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error submitting review');
        } finally {
            setSubmitting(false);
        }
    };

    const getReviewAuthor = (r: Review) => {
        if (r.username) return r.username;
        if (typeof r.userId === 'object' && r.userId?.name) return r.userId.name;
        return 'Arcade Player';
    };

    const getReviewRating = (r: Review) => r.rating ?? r.starRating ?? 5;
    const getReviewText = (r: Review) => r.comment ?? r.reviewText ?? '';

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-6 sm:p-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-4">
                        <FaComments /> Player Community
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold font-gaming tracking-wide mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                        REVIEWS & FEEDBACK
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Hear from fellow gamers or drop your thoughts on any game.
                    </p>
                </div>

                {/* Game Selection Pills */}
                <div className="flex flex-wrap gap-2 justify-center mb-10 p-2 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-purple-500/20">
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => setSelectedGame(game.id)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-gaming font-semibold transition-all duration-200 ${
                                selectedGame === game.id
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400/40'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                            }`}
                        >
                            {game.name}
                        </button>
                    ))}
                </div>

                {/* Review Submission Form */}
                {isLoggedIn ? (
                    <motion.form 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmitReview} 
                        className="mb-12 bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold font-gaming text-white">
                                    Drop a Review for {games.find(g => g.id === selectedGame)?.name}
                                </h2>
                                <p className="text-xs text-gray-400">Posting as <span className="text-purple-300 font-semibold">{user?.name}</span></p>
                            </div>

                            {/* Interactive Star Rating */}
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                                        aria-label={`Rate ${star} star`}
                                    >
                                        {(hoverRating || rating) >= star ? (
                                            <FaStar className="text-yellow-400 drop-shadow" />
                                        ) : (
                                            <FaRegStar className="text-gray-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="What do you think of this game? Strategy tips, mechanics, or thoughts..."
                            className="w-full bg-gray-950/80 text-white rounded-xl p-4 mb-4 border border-gray-700/60 focus:border-purple-500 focus:outline-none transition-colors min-h-[110px]"
                            required
                            minLength={5}
                            maxLength={500}
                        />

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">{reviewText.length}/500 chars</span>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-gaming font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Post Review'}
                            </button>
                        </div>
                    </motion.form>
                ) : (
                    <div className="text-center p-6 bg-purple-950/20 border border-purple-500/20 rounded-2xl mb-12">
                        <p className="text-gray-300 mb-2">Log in to rate and review your favorite games!</p>
                        <a href="/login" className="inline-block px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors">
                            Sign In to Review
                        </a>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold font-gaming text-white mb-4 flex items-center gap-2">
                        <span>{games.find(g => g.id === selectedGame)?.name} Community Reviews</span>
                        <span className="text-xs font-normal px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                            {reviews.length}
                        </span>
                    </h2>
                    
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-16 bg-gray-900/40 border border-purple-500/10 rounded-2xl">
                            <p className="text-gray-400 mb-1">No reviews yet for this title.</p>
                            <p className="text-xs text-gray-600">Be the first player to share your rating and review!</p>
                        </div>
                    ) : (
                        reviews.map((review, idx) => (
                            <motion.div
                                key={review._id || review.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-gray-900/70 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-white font-gaming text-base flex items-center gap-2">
                                            {getReviewAuthor(review)}
                                        </h3>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {review.createdAt || review.timestamp 
                                                ? new Date(review.createdAt || review.timestamp!).toLocaleDateString()
                                                : 'Recent'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            i < getReviewRating(review) ? (
                                                <FaStar key={i} />
                                            ) : (
                                                <FaRegStar key={i} className="text-gray-700" />
                                            )
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{getReviewText(review)}</p>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;