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
import SlidingPuzzle from "./components/SlidingPuzzle";
import Tetris from "./components/tetris";
import { useAuth } from './context/AuthContext';
import LeaderboardPage from './components/LeaderboardPage';
import ReviewsPage from './components/ReviewsPage';
import ScrollToTop from './components/ScrollToTop';
import Tutorials from './components/tutorials';
import { SearchProvider } from './context/SearchContext';

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
      <SearchProvider>
        <ScrollToTop />
        <div className="bg-gray-950 text-white flex flex-col">
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
          <div className="flex flex-1">
            <Sidebar setSidebarVisible={setSidebarVisible} visible={sidebarVisible} />
            <div className="flex-1 flex flex-col">
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
                <Route path="/sliding-puzzle" element={<SlidingPuzzle userId={user?.id} />} />
                <Route path="/tetris" element={<Tetris userId={user?.id} />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/tutorials" element={<Tutorials />} />
              </Routes>
            </div>
          </div>
        </div>
      </SearchProvider>
    </Router>
  );
};

export default App;