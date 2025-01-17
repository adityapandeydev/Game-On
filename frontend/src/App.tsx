import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import GameGrid from "./components/GameGrid";

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <div className="bg-gray-950 text-white">
      {/* Header */}
      <Header onSidebarToggle={() => setSidebarVisible(!sidebarVisible)} />

      <div className="flex h-[calc(100%-4rem)]">
        {/* Sidebar */}
        <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <GameGrid />
        </div>
      </div>
    </div>
  );
};

export default App;
