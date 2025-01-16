import React from "react";

interface SidebarProps {
    visible: boolean;
    setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ visible, setSidebarVisible }) => {
    const sections = [
        { icon: "🏠", text: "Home" },
        { icon: "🕹️", text: "Recently Played" },
        { icon: "🔥", text: "Trending Now" },
        { icon: "🏆", text: "Leaderboard" },
        "divider",
        { icon: "🧩", text: "Puzzle" },
        { icon: "🛡️", text: "Strategy" },
        { icon: "📘", text: "Education" },
        "divider",
    ];

    const hiddenSections = [
        { icon: "✉️", text: "Contact Us", isButton: true },
        { text: "About" },
        { text: "Developers" },
    ];

    return (
        <div
            className={`${visible ? "hidden" : "w-16"
                } group relative h-full bg-gray-800 transition-all duration-300`}
            onMouseEnter={(e) => e.currentTarget.classList.add("w-48")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("w-48")}
        >
            {/* Sidebar Content */}
            <div className="mt-4">
                {sections.map((section, index) =>
                    section === "divider" ? (
                        <hr key={index} className="border-gray-600 my-2" />
                    ) : (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-4 text-sm font-medium hover:bg-gray-700 cursor-pointer"
                        >
                            {section.icon && <span className="text-xl">{section.icon}</span>}
                            <span className="hidden group-hover:inline">{section.text}</span>
                        </div>
                    )
                )}

                {/* Render hidden sections only when the sidebar is fully expanded */}
                <div className="hidden group-hover:block mt-4">
                    {hiddenSections.map((section, index) =>
                        section.isButton ? (
                            <button
                                key={index}
                                className="flex items-center gap-4 p-4 text-sm font-medium bg-purple-600 hover:bg-purple-500 rounded-2xl mt-4 ml-6"
                            >
                                {section.icon && <span className="text-xl">{section.icon}</span>}
                                <span>{section.text}</span>
                            </button>
                        ) : (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 text-sm font-medium hover:bg-gray-700 cursor-pointer"
                            >
                                {section.icon && <span className="text-xl">{section.icon}</span>}
                                <span>{section.text}</span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
