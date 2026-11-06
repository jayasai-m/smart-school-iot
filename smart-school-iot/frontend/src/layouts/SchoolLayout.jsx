import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StaffUploadModal } from '../components/StaffUploadModal';
import {
  LayoutDashboard,
  Box,
  Droplets,
  UtensilsCrossed,
  AlertTriangle,
  User,
  LogOut,
  Menu,
  X,
  School as SchoolIcon,
  PlusCircle,
  Activity
} from 'lucide-react';

export const SchoolLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/school/dashboard', icon: LayoutDashboard },
    { name: 'Digital Twin', path: '/school/digital-twin', icon: Box },
    { name: 'Water Quality & Tank', path: '/school/water', icon: Droplets },
    { name: 'Meal & Kitchen Hygiene', path: '/school/meals', icon: UtensilsCrossed },
    { name: 'Incident & Alerts', path: '/school/alerts', icon: AlertTriangle },
    { name: 'Profile', path: '/school/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* School Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <SchoolIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">SmartSchoolIoT</h1>
              <p className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase">School Field Node</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School Identification Card */}
        <div className="m-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <p className="text-[10px] font-bold tracking-wider text-teal-400 uppercase">Registered Institution</p>
          <p className="text-xs font-semibold text-white mt-0.5 truncate">{user?.school_name || 'ZPHS Poranki'}</p>
          <div className="flex items-center space-x-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] text-emerald-400 font-medium">Node Active</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                SCH
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400">School Operator</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold text-teal-400 tracking-wide uppercase">
                {user?.school_name || 'ZPHS Poranki'}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-normal">
                • Field Telemetry & Mid-Day Meal Node
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-teal-500/10 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Staff Upload</span>
            </button>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Staff Upload Modal */}
      <StaffUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        schoolName={user?.school_name || 'ZPHS Poranki'}
        onUploadSuccess={() => {
          // Trigger any reload listeners if necessary
          window.dispatchEvent(new Event('meal_uploaded'));
        }}
      />
    </div>
  );
};
