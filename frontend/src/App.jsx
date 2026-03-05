import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { TradeProvider } from './context/TradeContext';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { MarketDataProvider } from './context/MarketDataContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Positions from './pages/Positions';
import Login from './pages/Login';
import Signup from './pages/Signup';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-foreground/40 text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
    return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
            <Navbar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/positions" element={<PrivateRoute><Positions /></PrivateRoute>} />
                    <Route path="/stocks" element={<PrivateRoute><Stocks /></PrivateRoute>} />
                    <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                    <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <MarketDataProvider>
                    <WatchlistProvider>
                        <PortfolioProvider>
                            <TradeProvider>
                                <Router>
                                    <AppContent />
                                </Router>
                            </TradeProvider>
                        </PortfolioProvider>
                    </WatchlistProvider>
                </MarketDataProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
