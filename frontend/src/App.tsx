import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import GameGrid from "./components/GameGrid";
import Login from "./components/Login";
import SignUp from "./components/SignUp";

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <Router>
      <div className="bg-gray-950 text-white">
        {/* Header with openLoginModal prop */}
        <Header onSidebarToggle={() => setSidebarVisible(!sidebarVisible)} />

        <div className="flex h-[calc(100%-4rem)]">
          {/* Sidebar */}
          <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/" element={<GameGrid />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
