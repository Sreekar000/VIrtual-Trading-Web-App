import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import API_BASE_URL from '../config';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaders();
    }, []);

    const fetchLeaders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/leaderboard`);
            setLeaders(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="text-yellow-400" size={24} />;
            case 1: return <Medal className="text-slate-300" size={24} />;
            case 2: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="text-foreground/40 font-bold ml-1">{index + 1}</span>;
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]">Loading Leaderboard...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <Trophy className="mx-auto text-primary" size={64} />
                <h1 className="text-4xl font-black">Top Traders</h1>
                <p className="text-foreground/60 font-medium">Ranked by total returns and current balance</p>
            </header>

            <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden mt-12">
                <div className="p-6 bg-primary/5 border-b border-border flex items-center justify-between font-bold text-foreground/60">
                    <div className="flex items-center space-x-8">
                        <span className="ml-2">Rank</span>
                        <span>Trader</span>
                    </div>
                    <span>Account Value</span>
                </div>

                <div className="divide-y divide-border">
                    {leaders.length === 0 ? (
                        <p className="p-12 text-center text-foreground/40">No traders yet. Be the first!</p>
                    ) : (
                        leaders.map((leader, index) => (
                            <div key={leader._id} className={`p-6 flex items-center justify-between hover:bg-background transition-all ${index === 0 ? 'bg-primary/5' : ''}`}>
                                <div className="flex items-center space-x-8">
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${index === 0 ? 'bg-primary/20 text-primary' : 'bg-background text-foreground/40'}`}>
                                            <User size={20} />
                                        </div>
                                        <span className={`font-black text-lg ${index === 0 ? 'text-primary' : ''}`}>{leader.name}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-xl">₹{leader.balance.toLocaleString('en-IN')}</span>
                                    <p className="text-xs text-green-500 font-bold">+0.00%</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
