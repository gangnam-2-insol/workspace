import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import Portfolio from './pages/Portfolio';
import Recommendations from './pages/Recommendations';
import Interviews from './pages/Interviews';
import MyPage from './pages/MyPage';
import CompanyManagement from './pages/CompanyManagement';
import JoinWithInvite from './pages/JoinWithInvite';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/company-management" element={<CompanyManagement />} />
            <Route path="/join" element={<JoinWithInvite />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
