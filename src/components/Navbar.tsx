import React, { useState } from 'react';
import { Sparkles, MessageSquare, Bell, Wallet, User as UserIcon, LogOut, ShieldAlert, Hammer, Globe } from 'lucide-react';
import { User, Notification } from '../types';

interface NavbarProps {
  user: User | null;
  notifications: Notification[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  onOpenNotifications: () => void;
}

export default function Navbar({
  user,
  notifications,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenNotifications
}: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const unreadCount = notifications.filter(n => n.readStatus === 'unread').length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex cursor-pointer items-center gap-2"
            id="navbar-logo"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">PRO DIGITAL™</span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-indigo-400">Marketplace</span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`transition hover:text-white ${activeTab === 'home' ? 'text-white font-semibold border-b-2 border-indigo-500 pb-1 mt-1' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab('tools')} 
              className={`transition hover:text-white ${activeTab === 'tools' || activeTab === 'detail' ? 'text-white font-semibold border-b-2 border-indigo-500 pb-1 mt-1' : ''}`}
            >
              Explore AI Tools
            </button>
            {user && (
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`transition hover:text-white ${activeTab === 'dashboard' || activeTab === 'workspace' ? 'text-white font-semibold border-b-2 border-indigo-500 pb-1 mt-1' : ''}`}
              >
                My Workspace
              </button>
            )}
            {user && (user.role === 'creator' || user.role === 'admin') && (
              <button 
                onClick={() => setActiveTab('creator')} 
                className={`transition hover:text-white ${activeTab === 'creator' ? 'text-white font-semibold border-b-2 border-indigo-500 pb-1 mt-1' : ''}`}
              >
                Creator Panel
              </button>
            )}
            {user && user.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('admin')} 
                className={`transition hover:text-indigo-400 ${activeTab === 'admin' ? 'text-indigo-400 font-semibold border-b-2 border-indigo-500 pb-1 mt-1' : ''}`}
              >
                Admin Panel
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Credit Wallet Ticker */}
                <div 
                  onClick={() => setActiveTab('dashboard')}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5 transition hover:border-indigo-500/50"
                  title="Your current AI Credit balance. Click to recharge."
                >
                  <Wallet className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">{user.credits} <span className="text-[10px] text-slate-500 font-normal">Credits</span></span>
                </div>

                {/* Notifications Bell */}
                <button 
                  onClick={onOpenNotifications}
                  className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                  id="navbar-notification-bell"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 p-1 pr-2 hover:bg-slate-900 transition"
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="h-7 w-7 rounded-md object-cover border border-slate-700" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="hidden sm:inline text-xs font-semibold text-slate-300">{user.name.split(' ')[0]}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl ring-1 ring-black/5">
                      <div className="px-3 py-2 border-b border-slate-900 mb-1">
                        <p className="text-xs font-bold text-slate-200">{user.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[9px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          {user.role}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => { setActiveTab('dashboard'); setShowProfileMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-900 hover:text-white transition text-left"
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                        My Dashboard
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setActiveTab('admin'); setShowProfileMenu(false); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-indigo-400 hover:bg-slate-900 hover:text-indigo-300 transition text-left font-semibold"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => { onLogout(); setShowProfileMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('login')} 
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setActiveTab('login'); /* trigger register */ }} 
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition"
                >
                  Register Free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
