import React from "react";

interface HeaderProps {
    onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
    return (
        <header className="flex items-center p-4 bg-gray-800 shadow-md">
            <button
                className="text-2xl mr-4 focus:outline-none"
                onClick={onSidebarToggle}
            >
                ☰
            </button>
            <h1 className="text-lg font-bold flex-1">My Gaming Site</h1>
            <input
                type="text"
                className="flex-1 max-w-md p-2 rounded-xl bg-gray-900 text-textSecondary focus:outline-none"
                placeholder="Search games..."
            />
            <div className="flex items-center gap-4 ml-4">
                <button className="p-2 bg-gray-800 rounded hover:bg-gray-700">
                    👥 Friends
                </button>
                <button className="p-2 bg-blue-600 rounded hover:bg-blue-500">
                    Log In
                </button>
            </div>
        </header>
    );
};

export default Header;
