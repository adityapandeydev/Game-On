import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const SignUp: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser, setIsLoggedIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post("/api/auth/signup", {
                name,
                email,
                password,
            });

            const { token, user } = response.data;

            if (token) {
                localStorage.setItem("token", token);
            }
            if (user) {
                localStorage.setItem("user", JSON.stringify(user));
                setUser(user);
                setIsLoggedIn(true);
            }

            navigate("/", { replace: true });
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data?.msg) {
                setError(err.response.data.msg);
            } else {
                setError("Registration failed. Please try again.");
            }
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
                    <span className="text-4xl mb-2 block">✨</span>
                    <h2 className="text-3xl font-extrabold font-gaming tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                        CREATE ACCOUNT
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Join Game-On and record your high scores</p>
                </div>

                {error && (
                    <div className="bg-red-950/40 border border-red-500/40 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">PLAYER NAME</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="GamerTag"
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">EMAIL ADDRESS</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="player@gameon.com"
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 font-semibold mb-1">CONFIRM PASSWORD</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-950/80 border border-gray-800 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-gaming font-semibold shadow-lg shadow-purple-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Creating Profile..." : "Join Game-On"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline">
                        Log In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default SignUp;
