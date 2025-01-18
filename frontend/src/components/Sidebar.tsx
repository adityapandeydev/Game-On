import React from "react";
import { FaDiscord, FaLinkedin, FaTwitter, FaYoutube, FaGithub, FaComments, FaGraduationCap } from 'react-icons/fa';
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
        { icon: "🔥", text: "Trending Now", id: "trending", path: "/" },
        { icon: "🏆", text: "Leaderboard", path: "/leaderboard" },
        "divider",
        { icon: "🧩", text: "Puzzle", id: "puzzle", path: "/" },
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

        // Handle special routes first
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

        // Handle sections with IDs (scrollable sections)
        if (section.id) {
            if (location.pathname === '/') {
                // If already on home page, just scroll
                scrollToSection(section.id);
            } else {
                // If on another page, navigate to home then scroll
                navigate('/', { state: { scrollTo: section.id } });
            }
        }
    };

    // Handle scrolling after navigation to home page
    React.useEffect(() => {
        if (location.pathname === '/' && location.state?.scrollTo) {
            const id = (location.state as { scrollTo: string }).scrollTo;
            setTimeout(() => {
                scrollToSection(id);
            }, 100);
        }
    }, [location]);

    return (
        <div
            className={`${visible ? "hidden" : "w-16"
            } group sticky top-1 h-screen bg-gray-800 transition-all duration-300 z-20`}
            onMouseEnter={(e) => e.currentTarget.classList.add("w-48")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("w-48")}
        >
            <div className="mt-4 bg-gray-800 h-full flex flex-col justify-between">
                {/* Game Sections */}
                <div>
                    {sections.map((section, index) =>
                        section === "divider" ? (
                            <hr key={index} className="border-gray-600 my-2" />
                        ) : (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 text-sm font-medium hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleSectionClick(section)}
                            >
                                <span className="text-xl">{section.icon}</span>
                                <span className="hidden group-hover:inline">{section.text}</span>
                            </div>
                        )
                    )}

                    {/* Reviews and Tutorials Buttons */}
                    <div>
                        <div
                            className="flex items-center gap-4 p-4 text-sm font-medium hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleSectionClick({ text: "Reviews", path: "/reviews" })}
                        >
                            <span className="text-xl"><FaComments /></span>
                            <span className="hidden group-hover:inline">Reviews</span>
                        </div>
                        <div
                            className="flex items-center gap-4 p-4 text-sm font-medium hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleSectionClick({ text: "Tutorials", path: "/tutorials" })}
                        >
                            <span className="text-xl"><FaGraduationCap /></span>
                            <span className="hidden group-hover:inline">Tutorials</span>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="hidden group-hover:block border-t border-gray-700 p-4">
                    {/* Contact */}
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Contact Us</h3>
                        <a
                            href="mailto:rohitmukkala@gameon.com"
                            className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                            rohit@gameon.com
                        </a>
                    </div>

                    {/* Social Links */}
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Follow Us</h3>
                        <div className="flex space-x-3">
                            <a 
                                href="https://github.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                            >
                                <FaGithub size={16} />
                            </a>
                            <a 
                                href="https://discord.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                            >
                                <FaDiscord size={16} />
                            </a>
                            <a 
                                href="https://linkedin.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                            >
                                <FaLinkedin size={16} />
                            </a>
                            <a 
                                href="https://twitter.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                            >
                                <FaTwitter size={16} />
                            </a>
                            <a 
                                href="https://youtube.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-purple-400 transition-colors"
                            >
                                <FaYoutube size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs text-gray-500">
                        © {new Date().getFullYear()} Game On
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

