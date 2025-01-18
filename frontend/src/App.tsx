import React, { useState } from "react";
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
import MathQuiz from "./components/MathQuiz";
import CapitalCitiesQuiz from "./components/CapitalCitiesQuiz";
import TypingTestGame from "./components/TypingTestGame";
import Challenge from "./components/Challenge";
import SlidingPuzzle from "./components/SlidingPuzzle";
import Tetris from "./components/tetris";
import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { user, isLoggedIn, setUser, setIsLoggedIn } = useAuth();

  const handleLogin = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  };

  return (
    <Router>
      <div className="bg-gray-950 text-white min-h-screen">
        <Header
          onSidebarToggle={() => setSidebarVisible(!sidebarVisible)}
          isLoggedIn={isLoggedIn}
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
            setIsLoggedIn(false);
          }}
        />

        <div className="flex h-[calc(100%-4rem)]">
          <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />

          <div className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route path="/" element={<GameGrid isLoggedIn={isLoggedIn} />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/tictactoe" element={<TicTacToe userId={user?.id} />} />
              <Route path="/connect4" element={<Connect4 userId={user?.id} />} />
              <Route path="/pig-game" element={<PigGame userId={user?.id} />} />
              <Route path="/guess-number" element={<GuessMyNumber userId={user?.id} />} />
              <Route path="/math-quiz" element={<MathQuiz userId={user?.id} />} />
              <Route path="/capital-cities" element={<CapitalCitiesQuiz userId={user?.id} />} />
              <Route path="/typing-test" element={<TypingTestGame userId={user?.id} />} />
              <Route path="/math-challenge" element={<Challenge userId={user?.id} />} />
              <Route path="/sliding-puzzle" element={<SlidingPuzzle userId={user?.id} />} />
              <Route path="/tetris" element={<Tetris userId={user?.id} />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
