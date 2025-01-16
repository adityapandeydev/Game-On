import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import GameGrid from "./components/GameGrid";

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <div className="h-screen bg-gray-900 text-white">
      {/* Header */}
      <Header onSidebarToggle={() => setSidebarVisible(!sidebarVisible)} />

      <div className="flex h-[calc(100%-4rem)]">
        {/* Sidebar */}
        <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <GameGrid />
        </div>
      </div>
    </div>
  );
};

export default App;
