import React from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    onSidebarToggle: () => void;
    isLoggedIn: boolean;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, isLoggedIn, onLogout }) => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate("/login");
    };

    const handleHomeClick = () => {
        navigate("/");
    };

    return (
        <header className="flex items-center p-4 bg-gray-800 shadow-md sticky top-0 z-10">
            <button
                className="text-2xl ml-1 mr-4 focus:outline-none"
                onClick={onSidebarToggle}
            >
                ☰
            </button>
            <div className="flex items-center cursor-pointer" onClick={handleHomeClick}>
                <img src="/vite.svg" alt="Site Logo" className="h-8 w-8 mr-2 ml-1" />
                <h1 className="text-lg font-bold flex-1 hidden sm:block">Game On</h1>
            </div>
            <input
                type="text"
                className="flex-1 p-2 rounded-xl bg-gray-900 text-textSecondary focus:outline-none max-w-40 sm:max-w-md md:max-w-lg lg:max-w-xl ml-4"
                placeholder="Search"
            />
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                <button className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-sm sm:text-base">
                    👥 Friends
                </button>
                {isLoggedIn ? (
                    <button
                        onClick={onLogout}
                        className="p-2 bg-red-600 rounded hover:bg-red-500 text-sm sm:text-base"
                    >
                        Log Out
                    </button>
                ) : (
                    <button
                        onClick={handleLoginClick}
                        className="p-2 bg-blue-600 rounded hover:bg-blue-500 text-sm sm:text-base"
                    >
                        Log In
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;

