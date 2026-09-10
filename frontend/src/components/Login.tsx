import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            setLoading(true);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(data.msg || data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('Invalid server response: missing token');
            }

            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            onLogin();
            navigate('/', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex justify-center items-center px-4 py-12 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border border-purple-500/30 shadow-2xl"
            >
                <div className="text-center mb-6">
                    <span className="text-4xl mb-2 block">🎮</span>
                    <h2 className="text-3xl font-extrabold font-gaming tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                        WELCOME BACK
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Sign in to track high scores and achievements</p>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-500/40 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">EMAIL ADDRESS</label>
                        <input
                            type="email"
                            placeholder="player@gameon.com"
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">PASSWORD</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-gaming font-semibold shadow-lg shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline">
                        Create One Free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
