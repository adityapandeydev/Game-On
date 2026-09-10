import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaTrophy, FaComments, FaGraduationCap, FaSignOutAlt, FaBars } from 'react-icons/fa';

interface HeaderProps {
    onSidebarToggle: () => void;
    isLoggedIn: boolean;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, isLoggedIn, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { searchTerm, setSearchTerm } = useSearch();
    const { user } = useAuth();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (location.pathname !== '/') {
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-purple-500/20 px-4 sm:px-8 py-3.5 transition-all shadow-xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Left: Sidebar Toggle & Brand Logo */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSidebarToggle}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900/80 border border-transparent hover:border-purple-500/30 transition-all focus:outline-none"
                        aria-label="Toggle Navigation Sidebar"
                    >
                        <FaBars size={18} />
                    </button>

                    <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-2 ring-purple-500/40 group-hover:ring-purple-400 transition-all shadow-md shadow-purple-500/30">
                            <img src="/logo2.jpg" alt="Game-On" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-xl font-extrabold font-gaming tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-transparent bg-clip-text">
                            GAME ON
                        </span>
                    </Link>
                </div>

                {/* Center: Search Bar */}
                <div className="flex-1 max-w-md mx-2 hidden sm:block">
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search games, categories..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Quick Nav Links (Desktop) */}
                <nav className="hidden lg:flex items-center gap-1">
                    <Link
                        to="/leaderboard"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-gaming font-semibold transition-all ${
                            location.pathname === '/leaderboard'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <FaTrophy className="text-yellow-400" /> Leaderboard
                    </Link>
                    <Link
                        to="/reviews"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-gaming font-semibold transition-all ${
                            location.pathname === '/reviews'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <FaComments className="text-cyan-400" /> Reviews
                    </Link>
                    <Link
                        to="/tutorials"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-gaming font-semibold transition-all ${
                            location.pathname === '/tutorials'
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                                : 'text-gray-400 hover:text-white hover:bg-gray-900'
                        }`}
                    >
                        <FaGraduationCap className="text-pink-400" /> Guides
                    </Link>
                </nav>

                {/* Right: User Auth & Profile */}
                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 pl-3 py-1 pr-2 rounded-xl bg-gray-900/80 border border-purple-500/30 text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="font-gaming font-semibold text-purple-200">{user?.name || 'Player'}</span>
                            </div>
                            <button
                                onClick={onLogout}
                                title="Log Out"
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition-all"
                            >
                                <FaSignOutAlt />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate("/login")}
                                className="px-4 py-2 rounded-xl text-xs font-gaming font-semibold text-gray-300 hover:text-white hover:bg-gray-900 transition-all"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate("/signup")}
                                className="px-4 py-2 rounded-xl text-xs font-gaming font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/25 transition-all"
                            >
                                Play Free
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
