import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiKeyProvider } from './context/ApiKeyContext';

// Core UI Components
import Sidebar from './components/Sidebar';
import AIChat from './components/AIChat';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Lookup from './pages/Lookup';
import Churn from './pages/Churn';
import Segments from './pages/Segments';
import Retention from './pages/Retention';
import CLV from './pages/CLV';
import AI from './pages/AI';
import Anomalies from './pages/Anomalies';
import About from './pages/About';

// Query Client initialization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background re-fetches
      retry: 1
    }
  }
});

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null); // Lifted CRM profile state
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-bg text-text-primary flex">
      {/* Left Sidebar Navigation - hidden on Landing */}
      {!isLandingPage && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      {/* Right Main Panel Container */}
      <div className={`flex-1 flex flex-col min-w-0 ${isLandingPage ? '' : 'md:pl-[220px]'}`}>
        {/* Top spacer on mobile for the fixed hamburger menu */}
        {!isLandingPage && (
          <div className="h-16 md:hidden shrink-0 border-b border-border bg-card flex items-center justify-end px-6 flex items-center">
            <span className="font-bold tracking-tight text-accent text-sm">✈ LoyaltyIQ</span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <main className={`flex-1 overflow-y-auto ${isLandingPage ? 'p-0' : 'p-6 md:p-8'}`}>
          <div className={isLandingPage ? 'w-full' : 'max-w-6xl mx-auto'}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard setActiveMember={setActiveMember} />} />
              <Route path="/lookup" element={<Lookup activeMember={activeMember} setActiveMember={setActiveMember} />} />
              <Route path="/churn" element={<Churn setActiveMember={setActiveMember} />} />
              <Route path="/segments" element={<Segments />} />
              <Route path="/retention" element={<Retention setActiveMember={setActiveMember} />} />
              <Route path="/clv" element={<CLV setActiveMember={setActiveMember} />} />
              <Route path="/ai" element={<AI />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Floating Strategy Assistant Widget */}
      <AIChat activeMember={activeMember} />
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ApiKeyProvider>
    </QueryClientProvider>
  );
};

export default App;
