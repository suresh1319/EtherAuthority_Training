import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/layout/Header';
import Dashboard from './components/Dashboard';
import InternRegistration from './components/InternRegistration';
import TaskManagement from './components/TaskManagement';
import NFTGallery from './components/NFTGallery';
import Profile from './components/Profile';

function App() {
    const [walletAddress, setWalletAddress] = useState(null);
    const [selectedIntern, setSelectedIntern] = useState(null);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="app">
                <Header
                    walletAddress={walletAddress}
                    setWalletAddress={setWalletAddress}
                />

                <main className="app-body fade-in">
                    <Routes>
                        <Route path="/" element={<Dashboard selectedIntern={selectedIntern} />} />
                        <Route path="/register" element={<InternRegistration />} />
                        <Route
                            path="/tasks"
                            element={
                                <TaskManagement
                                    selectedIntern={selectedIntern}
                                    setSelectedIntern={setSelectedIntern}
                                />
                            }
                        />
                        <Route path="/nfts" element={<NFTGallery selectedIntern={selectedIntern} />} />
                        <Route
                            path="/profile"
                            element={
                                <Profile
                                    selectedIntern={selectedIntern}
                                    setSelectedIntern={setSelectedIntern}
                                />
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
