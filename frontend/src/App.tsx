import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Players from './pages/Players';
import Games from './pages/Games';
import Analytics from './pages/Analytics';
import AddGame from './pages/AddGame';
import PasswordReset from './pages/PasswordReset';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/games" element={<Games />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/add-game" element={<AddGame />} />
              <Route path="/reset-deletion-password" element={<PasswordReset />} />
            </Routes>
          </Layout>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App; 