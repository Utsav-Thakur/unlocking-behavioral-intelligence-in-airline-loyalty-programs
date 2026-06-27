import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  Users, 
  AlertTriangle, 
  PieChart, 
  Target, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  Info,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { to: '/lookup', label: 'Member Lookup', icon: Users },
    { to: '/churn', label: 'Churn Explorer', icon: AlertTriangle },
    { to: '/segments', label: 'Segments', icon: PieChart },
    { to: '/retention', label: 'Retention', icon: Target },
    { to: '/clv', label: 'CLV Analysis', icon: TrendingUp },
    { to: '/ai', label: '✦ AI Strategy', icon: Sparkles, isAi: true },
    { to: '/anomalies', label: 'Data Quality', icon: AlertCircle },
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-card border border-border rounded-md text-text-primary focus:outline-none hover:bg-card-hover"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile overlay */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-45 w-[220px] bg-card border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 py-6 overflow-y-auto">
          {/* Logo Section */}
          <div className="px-6 mb-6 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-accent flex items-center gap-2 font-display">
              <span className="text-2xl animate-pulse">✈</span> LoyaltyIQ
            </span>
            <button 
              onClick={toggleSidebar}
              className="md:hidden text-text-secondary hover:text-text-primary"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 pr-3">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => {
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                  className={({ isActive }) => {
                    const baseClass = "flex items-center gap-3 pl-4 pr-3 py-2.5 border-l-4 transition-all duration-150 font-medium text-sm";
                    if (isActive) {
                      return `${baseClass} border-accent bg-accent/10 text-accent rounded-r-full font-semibold`;
                    }
                    if (link.isAi) {
                      return `${baseClass} border-transparent text-accent/90 hover:bg-card-hover hover:text-accent rounded-r-full`;
                    }
                    return `${baseClass} border-transparent text-text-secondary hover:bg-card-hover hover:text-text-primary rounded-r-full`;
                  }}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${link.isAi ? 'text-accent drop-shadow-[0_0_8px_rgba(88,166,255,0.4)]' : ''}`} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-border bg-card">
          <p className="text-[10px] text-text-secondary text-center font-medium select-none">
            Built by Utsav · LoyaltyIQ v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
