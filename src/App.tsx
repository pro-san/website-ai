import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Wallet, Shield, Layers, HelpCircle, 
  MessageSquare, Terminal, User as UserIcon, RefreshCw 
} from 'lucide-react';
import { User, AITool, Category, Notification, ChatMessage, Order } from './types';

// Page Imports
import Home from './pages/Home';
import Tools from './pages/Tools';
import ToolDetail from './pages/ToolDetail';
import Workspace from './pages/Workspace';
import Dashboard from './pages/Dashboard';
import Creator from './pages/Creator';
import Admin from './pages/Admin';
import Login from './pages/Login';

// Component Imports
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import NotificationPanel from './components/NotificationPanel';

export default function App() {
  // Session States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loadingSession, setLoadingSession] = useState(true);

  // Collections States
  const [tools, setTools] = useState<AITool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const favs = localStorage.getItem('favorites');
      return favs ? JSON.parse(favs) : [];
    } catch {
      return [];
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'detail' | 'workspace' | 'dashboard' | 'creator' | 'admin' | 'login'>('home');
  const [selectedToolSlug, setSelectedToolSlug] = useState<string>('');
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Layout Drawers
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; visible: boolean; type?: 'info' | 'success' | 'error' } | null>(null);

  // Theme State (Dark Theme / High-contrast Light Theme)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error('Failed accessing local storage for theme:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Toast Helper
  const triggerToast = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ title, message, visible: true, type });
  };

  // Global Referral Link Detector
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
      sessionStorage.setItem('referralCode', ref);
    }
  }, []);

  // 1. Initial Session Hydration & Sync
  useEffect(() => {
    const fetchSessionAndData = async () => {
      // 1. Fetch catalog and categories regardless of auth state
      try {
        const [toolsRes, catRes] = await Promise.all([
          fetch('/api/tools'),
          // Simulate categories since they are static db models
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { id: 'cat-chat', name: 'AI Chat', icon: 'MessageSquare' },
              { id: 'cat-writing', name: 'AI Writing', icon: 'FileText' },
              { id: 'cat-image', name: 'AI Image', icon: 'Image' },
              { id: 'cat-video', name: 'AI Video', icon: 'Video' },
              { id: 'cat-voice', name: 'AI Voice', icon: 'Mic' }
            ])
          })
        ]);

        if (toolsRes.ok) setTools(await toolsRes.json());
        setCategories(await catRes.json());
      } catch (err) {
        console.error('Failed fetching marketplace parameters:', err);
      }

      // 2. Fetch authenticated session
      if (!token) {
        setLoadingSession(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          // Load specific auth items
          await loadUserData(token);
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Session syncing crashed:', err);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSessionAndData();
  }, [token]);

  // Load notifications and orders for user
  const loadUserData = async (authToken: string) => {
    try {
      const [notifRes, orderRes] = await Promise.all([
        fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);
      if (notifRes.ok) {
        setNotifications(await notifRes.json());
      }
      if (orderRes.ok) {
        setUserOrders(await orderRes.json());
      }
    } catch (e) {
      console.error('Failed loading specific user states:', e);
    }
  };

  const handleRefreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshTools = async () => {
    try {
      const res = await fetch('/api/tools');
      if (res.ok) {
        setTools(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Real-time WebSocket connection
  useEffect(() => {
    if (!user || !token) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        payload: {
          userId: user.id,
          name: user.name,
          role: user.role
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case 'notification': {
            setNotifications(prev => [payload, ...prev]);
            triggerToast(payload.title, payload.message, 'info');
            break;
          }
          case 'system_metrics': {
            // Optional: telemetry metrics logger can bind here
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket parsing error:', err);
      }
    };

    ws.onclose = () => {
      console.log('Real-time notification channel disconnected.');
    };

    return () => {
      ws.close();
    };
  }, [user, token]);

  // Auth Handlers
  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    triggerToast('Authenticated Successfully', `Welcome back, ${authUser.name}!`, 'success');
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    triggerToast('Sign Out Complete', 'Your active session has been securely closed.', 'info');
    setActiveTab('home');
  };

  // Favorites handlings
  const handleToggleFavorite = (toolId: string) => {
    const updated = favorites.includes(toolId)
      ? favorites.filter(id => id !== toolId)
      : [...favorites, toolId];
    
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    
    const isFav = updated.includes(toolId);
    triggerToast(
      isFav ? 'Added to Favorites' : 'Removed from Favorites',
      isFav ? 'Tool is now pinned to your favorites list.' : 'Tool removed from favorites pin.',
      'success'
    );
  };

  // Usage and Subscription settlements
  const handleUseNow = (tool: AITool) => {
    setActiveTool(tool);
    setActiveTab('workspace');
  };

  const handlePurchase = async (tool: AITool) => {
    if (!token) {
      setActiveTab('login');
      triggerToast('Authentication Required', 'Please register or sign in to purchase credits or tools.', 'error');
      return;
    }

    if (user && user.credits < tool.price) {
      triggerToast('Insufficient Funds', `You need $${tool.price} USD worth of credits to unlock ${tool.title}.`, 'error');
      setActiveTab('dashboard');
      return;
    }

    // Confirm Modal
    const confirmBuy = window.confirm(`Unlock full access to ${tool.title}? This will deduct $${tool.price} USD from your credit wallet.`);
    if (!confirmBuy) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toolId: tool.id,
          paymentMethod: 'stripe'
        })
      });

      if (res.ok) {
        triggerToast('Subscribed Successfully', `Full access to ${tool.title} unlocked! 1000 bonus credits credited.`, 'success');
        handleRefreshUser();
        handleRefreshTools();
        if (token) loadUserData(token);
        handleUseNow(tool);
      } else {
        const err = await res.json();
        triggerToast('Transaction Failed', err.error || 'Failed settling checkout.', 'error');
      }
    } catch (e) {
      console.error(e);
      triggerToast('Transaction Error', 'Failed reaching processing node.', 'error');
    }
  };

  // Notifications Operations
  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: 'read' } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, readStatus: 'read' })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Determine purchased list
  const purchasedToolIds = useMemo(() => {
    if (!user) return [];
    const freeTools = tools.filter(t => t.type === 'free').map(t => t.id);
    const orderedTools = userOrders.map(o => o.toolId);
    return Array.from(new Set([...freeTools, ...orderedTools]));
  }, [tools, userOrders, user]);

  const approvedTools = tools.filter(t => t.status === 'approved');

  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme === 'light' ? 'theme-light bg-white text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      
      {/* 1. GLOBAL NAVBAR HEADER */}
      <Navbar 
        user={user}
        notifications={notifications}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'tools') setSelectedToolSlug('');
        }}
        onLogout={handleLogout}
        onOpenNotifications={() => setShowNotificationsDrawer(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. THE MAIN ROUTING PAGE SPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loadingSession ? (
          <div className="flex flex-col h-[50vh] justify-center items-center gap-4">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Initializing PRO DIGITAL™ Node Sync...</p>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <Home 
                categories={categories}
                approvedTools={approvedTools}
                setActiveTab={setActiveTab}
                setSelectedToolSlug={(slug) => {
                  setSelectedToolSlug(slug);
                  setActiveTab('detail');
                }}
                onQuickUse={handleUseNow}
              />
            )}

            {activeTab === 'tools' && (
              <Tools 
                tools={tools}
                categories={categories}
                user={user}
                purchasedToolIds={purchasedToolIds}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onViewDetails={(slug) => {
                  setSelectedToolSlug(slug);
                  setActiveTab('detail');
                }}
                onUseNow={handleUseNow}
                onPurchase={handlePurchase}
              />
            )}

            {activeTab === 'detail' && (
              <ToolDetail 
                slug={selectedToolSlug}
                tools={tools}
                user={user}
                purchasedToolIds={purchasedToolIds}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onBack={() => setActiveTab('tools')}
                onUseNow={handleUseNow}
                onPurchase={handlePurchase}
                token={token}
              />
            )}

            {activeTab === 'workspace' && (
              <Workspace 
                activeTool={activeTool}
                tools={tools}
                user={user}
                token={token}
                onRefreshUser={handleRefreshUser}
                setActiveTab={setActiveTab}
                setActiveTool={setActiveTool}
                purchasedToolIds={purchasedToolIds}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard 
                user={user}
                token={token}
                onRefreshUser={handleRefreshUser}
              />
            )}

            {activeTab === 'creator' && (
              <Creator 
                user={user}
                tools={tools}
                categories={categories}
                token={token}
                onRefreshTools={handleRefreshTools}
              />
            )}

            {activeTab === 'admin' && (
              <Admin 
                user={user}
                tools={tools}
                token={token}
                onRefreshTools={handleRefreshTools}
              />
            )}

            {activeTab === 'login' && (
              <Login 
                onAuthSuccess={handleAuthSuccess}
                onBackToHome={() => setActiveTab('home')}
              />
            )}
          </>
        )}
      </main>

      {/* 3. GLOBAL FOOTER */}
      <Footer setActiveTab={setActiveTab} />

      {/* 4. NOTIFICATION PANEL SIDE DRAWER */}
      <NotificationPanel 
        notifications={notifications}
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* 5. FLOATING TOAST FEEDBACK ALERT */}
      <Toast 
        toast={toast}
        onClose={() => setToast(prev => prev ? { ...prev, visible: false } : null)}
      />

    </div>
  );
}
