import React from "react";
import { FaDiscord, FaTwitter, FaYoutube, FaGithub, FaComments, FaGraduationCap, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

type Section = {
    icon?: string;
    text: string;
    id?: string;
    path?: string;
} | "divider";

interface SidebarProps {
    visible: boolean;
    setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, setSidebarVisible }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const sections: Section[] = [
        { icon: "🏠", text: "Home", id: "home", path: "/" },
        { icon: "🕹️", text: "Recently Played", id: "recently-played", path: "/" },
        { icon: "🔥", text: "Top Trending", id: "trending", path: "/" },
        { icon: "🏆", text: "Leaderboard", path: "/leaderboard" },
        "divider",
        { icon: "🧩", text: "Puzzle Games", id: "puzzle", path: "/" },
        { icon: "🛡️", text: "Strategy", id: "strategy", path: "/" },
        { icon: "📘", text: "Education", id: "education", path: "/" },
        "divider",
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleSectionClick = (section: Section) => {
        if (section === "divider") return;
        setSidebarVisible(false);

        if (section.text === "Leaderboard") {
            navigate('/leaderboard');
            return;
        }
        if (section.text === "Reviews") {
            navigate('/reviews');
            return;
        }
        if (section.text === "Tutorials") {
            navigate('/tutorials');
            return;
        }

        if (section.id) {
            if (location.pathname === '/') {
                scrollToSection(section.id);
            } else {
                navigate('/', { state: { scrollTo: section.id } });
            }
        }
    };

    React.useEffect(() => {
        if (location.pathname === '/' && location.state?.scrollTo) {
            const id = (location.state as { scrollTo: string }).scrollTo;
            setTimeout(() => {
                scrollToSection(id);
            }, 100);
        }
    }, [location]);

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {visible && (
                <div 
                    onClick={() => setSidebarVisible(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:sticky top-0 lg:top-[61px] left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-61px)]
                    bg-gray-950/95 lg:bg-gray-950/80 backdrop-blur-2xl border-r border-purple-500/20
                    transition-all duration-300 ease-in-out flex flex-col justify-between overflow-y-auto overflow-x-hidden
                    ${visible ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16 hover:lg:w-56 group'}
                `}
            >
                <div>
                    {/* Mobile Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800 lg:hidden">
                        <span className="font-gaming font-bold text-sm tracking-wider bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                            ARCADE MENU
                        </span>
                        <button 
                            onClick={() => setSidebarVisible(false)}
                            className="p-2 text-gray-400 hover:text-white"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="p-2 space-y-1">
                        {sections.map((section, index) =>
                            section === "divider" ? (
                                <div key={index} className="my-2 border-t border-purple-500/10" />
                            ) : (
                                <button
                                    key={index}
                                    onClick={() => handleSectionClick(section)}
                                    className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-950/40 hover:border-purple-500/30 border border-transparent transition-all group/item text-left"
                                >
                                    <span className="text-xl flex-shrink-0 flex items-center justify-center w-6">
                                        {section.icon}
                                    </span>
                                    <span className={`text-xs font-gaming font-semibold tracking-wide whitespace-nowrap ${
                                        visible ? 'inline' : 'hidden group-hover:inline'
                                    }`}>
                                        {section.text}
                                    </span>
                                </button>
                            )
                        )}

                        {/* Guides & Reviews */}
                        <button
                            onClick={() => handleSectionClick({ text: "Reviews", path: "/reviews" })}
                            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-all text-left"
                        >
                            <span className="text-xl flex-shrink-0 flex items-center justify-center w-6 text-cyan-400">
                                <FaComments size={18} />
                            </span>
                            <span className={`text-xs font-gaming font-semibold tracking-wide whitespace-nowrap ${
                                visible ? 'inline' : 'hidden group-hover:inline'
                            }`}>
                                Reviews
                            </span>
                        </button>

                        <button
                            onClick={() => handleSectionClick({ text: "Tutorials", path: "/tutorials" })}
                            className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-all text-left"
                        >
                            <span className="text-xl flex-shrink-0 flex items-center justify-center w-6 text-pink-400">
                                <FaGraduationCap size={18} />
                            </span>
                            <span className={`text-xs font-gaming font-semibold tracking-wide whitespace-nowrap ${
                                visible ? 'inline' : 'hidden group-hover:inline'
                            }`}>
                                Tutorials
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Footer Section */}
                <div className={`p-4 border-t border-purple-500/10 ${
                    visible ? 'block' : 'hidden group-hover:block'
                }`}>
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Connect with us</p>
                    <div className="flex items-center space-x-3 text-gray-400 mb-3">
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">
                            <FaGithub size={15} />
                        </a>
                        <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">
                            <FaDiscord size={15} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">
                            <FaTwitter size={15} />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 transition-colors">
                            <FaYoutube size={15} />
                        </a>
                    </div>
                    <p className="text-[10px] text-gray-600">
                        © {new Date().getFullYear()} Game-On Arcade.
                    </p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
