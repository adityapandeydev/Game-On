import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import GameGrid from "./components/GameGrid";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import TicTacToe from "./components/TicTacToe";
import Connect4 from "./components/Connect4";
import PigGame from "./components/PigGame";
import GuessMyNumber from "./components/GuessMyNumber";

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Declare and manage the login state

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true); // Set isLoggedIn to true when login is successful
  };

  return (
    <Router>
      <div className="bg-gray-950 text-white">
        {/* Header with openLoginModal prop */}
        <Header
          onSidebarToggle={() => setSidebarVisible(!sidebarVisible)}
          isLoggedIn={isLoggedIn}
          onLogout={() => {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
          }}
        />

        <div className="flex h-[calc(100%-4rem)]">
          {/* Sidebar */}
          <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/" element={<GameGrid isLoggedIn={isLoggedIn} />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/tictactoe" element={<TicTacToe />} />
              <Route path="/connect4" element={<Connect4 />} />
              <Route path="/pig-game" element={<PigGame />} />
              <Route path="/guess-number" element={<GuessMyNumber />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
