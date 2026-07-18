import React, { useState, useEffect } from 'react';
import { 
  Wallet, Key, Calendar, ArrowUpRight, BarChart3, Clock, 
  CreditCard, Sparkles, Check, ChevronRight, Copy, RefreshCw, 
  TrendingUp, CircleDollarSign, Plus, Coins, Terminal, Download,
  Trophy, Target, Award, Gift
} from 'lucide-react';
import { User, CreditTransaction, UsageLog } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-900 bg-slate-950/95 p-3 shadow-2xl font-sans text-xs backdrop-blur-sm">
        <p className="font-bold text-slate-400 font-mono mb-1">{data.displayDate}</p>
        <p className="text-indigo-400 font-semibold flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>
          Credits: <span className="font-extrabold text-white">{payload[0].value}</span>
        </p>
        <p className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          Queries: <span className="font-extrabold text-white">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  user: User | null;
  token: string | null;
  onRefreshUser: () => void;
}

export default function Dashboard({ user, token, onRefreshUser }: DashboardProps) {
  const [subTab, setSubTab] = useState<'overview' | 'billing' | 'api-keys'>('overview');
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Top-up wallet form state
  const [topupAmount, setTopupAmount] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'crypto'>('stripe');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  // Developer Keys state
  const [apiKey, setApiKey] = useState('ac_live_7x89b4z12y00m8k9q1');
  const [showApiKey, setShowApiKey] = useState(false);

  // API Budget and Call States
  const [simulatedCallsCount, setSimulatedCallsCount] = useState<number>(() => {
    const saved = localStorage.getItem(`api_calls_count_${user?.id}`);
    if (saved) return parseInt(saved, 10);
    
    // Otherwise return dynamic initial base
    if (user?.subscriptionPlan === 'business') return 48291;
    if (user?.subscriptionPlan === 'pro') return 8412;
    return 248;
  });

  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestSuccess, setApiTestSuccess] = useState('');
  const [apiTestError, setApiTestError] = useState('');

  const getApiBudget = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'business':
        return { limit: 100000, name: 'Enterprise SaaS SDK Plan' };
      case 'pro':
      case 'pro digital':
        return { limit: 25000, name: 'Pro Digital SDK' };
      case 'free':
      default:
        return { limit: 1000, name: 'Free Trial SDK' };
    }
  };

  const handleSimulateApiCall = async () => {
    if (!token) return;
    setApiTesting(true);
    setApiTestSuccess('');
    setApiTestError('');

    try {
      const res = await fetch('/api/developer/simulate-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        const nextCount = simulatedCallsCount + 1;
        setSimulatedCallsCount(nextCount);
        localStorage.setItem(`api_calls_count_${user?.id}`, String(nextCount));
        setApiTestSuccess(data.message || 'API request executed successfully!');
        onRefreshUser();
        fetchHistory();
      } else {
        setApiTestError(data.error || 'Failed to dispatch API request.');
      }
    } catch (err) {
      console.error(err);
      setApiTestError('Network error trying to connect to API endpoint.');
    } finally {
      setApiTesting(false);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const [txRes, logRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/logs', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      if (logRes.ok) setUsageLogs(await logRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-sm font-bold text-slate-500">Please sign in to view your dashboard console.</p>
      </div>
    );
  }

  // Handle Wallet top-up purchase
  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setSubmittingTopup(true);
    try {
      const res = await fetch('/api/credits/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: topupAmount,
          paymentMethod
        })
      });

      if (res.ok) {
        alert(`Wallet charged successfully! Added ${topupAmount} Credits.`);
        onRefreshUser();
        fetchHistory();
      } else {
        alert('Failed to process wallet topup.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTopup(false);
    }
  };

  // Promo / Voucher Code States
  const [promoCode, setPromoCode] = useState('');
  const [submittingPromo, setSubmittingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !promoCode) return;

    setSubmittingPromo(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await fetch('/api/credits/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: promoCode })
      });

      const data = await res.json();
      if (res.ok) {
        setPromoSuccess(data.message);
        setPromoCode('');
        onRefreshUser();
        fetchHistory();
      } else {
        setPromoError(data.error || 'Failed to redeem promo code.');
      }
    } catch (err) {
      console.error(err);
      setPromoError('Network error trying to contact promo server.');
    } finally {
      setSubmittingPromo(false);
    }
  };

  // Generate new simulated API Key
  const generateNewApiKey = () => {
    const key = 'ac_live_' + Math.random().toString(36).substr(2, 16);
    setApiKey(key);
    alert('Simulated Production API Key rotated successfully!');
  };

  const copyKeyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copied to clipboard!');
  };

  const handleCopyReferral = () => {
    if (!user) return;
    const referralUrl = `${window.location.origin}/?ref=${user.id}`;
    navigator.clipboard.writeText(referralUrl);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const getChartData = () => {
    const data: { date: string; displayDate: string; credits: number; count: number }[] = [];
    const now = new Date();
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      data.push({
        date: dateString,
        displayDate,
        credits: 0,
        count: 0
      });
    }

    // Populate with real data from usageLogs
    usageLogs.forEach(log => {
      try {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const dayMatch = data.find(item => item.date === logDate);
        if (dayMatch) {
          dayMatch.credits += log.creditsSpent || 0;
          dayMatch.count += 1;
        }
      } catch (e) {
        console.error('Error parsing log timestamp', e);
      }
    });

    return data;
  };

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];
    
    // Section 1: Account Profile Summary
    csvRows.push('--- ACCOUNT PROFILE ---');
    csvRows.push(`User Name,${escapeCSV(user.name)}`);
    csvRows.push(`User Email,${escapeCSV(user.email)}`);
    csvRows.push(`Subscription Plan,${escapeCSV(user.subscriptionPlan)}`);
    csvRows.push(`Credits Remaining,${escapeCSV(user.credits)}`);
    csvRows.push(''); // Spacer row
    
    // Section 2: Wallet Transaction History
    csvRows.push('--- WALLET TRANSACTION HISTORY ---');
    csvRows.push('Timestamp,Description,Transaction Type,Credits Adjustment');
    if (transactions.length === 0) {
      csvRows.push('No transaction history recorded.,,,');
    } else {
      transactions.forEach(tx => {
        const formattedDate = new Date(tx.timestamp).toLocaleString();
        csvRows.push(`${escapeCSV(formattedDate)},${escapeCSV(tx.description)},${escapeCSV(tx.type)},${tx.amount > 0 ? '+' : ''}${tx.amount}`);
      });
    }
    csvRows.push(''); // Spacer row
    
    // Section 3: Active Workspace Usage History
    csvRows.push('--- ACTIVE WORKSPACE USAGE HISTORY ---');
    csvRows.push('Timestamp,AI Model,Query Prompt,Credits Spent');
    if (usageLogs.length === 0) {
      csvRows.push('No usage history recorded.,,,');
    } else {
      usageLogs.forEach(log => {
        const formattedDate = new Date(log.timestamp).toLocaleString();
        csvRows.push(`${escapeCSV(formattedDate)},${escapeCSV(log.toolTitle)},${escapeCSV(log.prompt)},-${log.creditsSpent}`);
      });
    }
    
    // Create Blob and trigger download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_history_report_${user.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16">
      
      {/* 1. Dashboard Sub-navigation Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-3">
          <div className="px-3 py-2 border-b border-slate-900">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Dashboard Navigation</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Control billing and credentials</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSubTab('overview')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Usage Overview
            </button>

            <button
              onClick={() => setSubTab('billing')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'billing'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <Wallet className="h-4 w-4" />
              Wallet & Top up
            </button>

            <button
              onClick={() => setSubTab('api-keys')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'api-keys'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <Key className="h-4 w-4" />
              Developer API Keys
            </button>
          </div>
        </div>

        {/* User Account Info Summary Card */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
            <div>
              <h4 className="text-xs font-bold text-slate-200">{user.name}</h4>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{user.email}</p>
            </div>
          </div>
          
          <div className="border-t border-slate-900 pt-3.5 space-y-2 text-[10px] text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>ACTIVE PLAN:</span>
              <span className="font-bold text-indigo-400 uppercase">{user.subscriptionPlan}</span>
            </div>
            <div className="flex justify-between">
              <span>CREDITS REMAINING:</span>
              <span className="font-bold text-white">{user.credits}</span>
            </div>
            <div className="pt-2 border-t border-slate-900/50">
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 p-2.5 text-[10px] font-bold text-slate-300 font-sans transition"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" />
                Download CSV Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard panel workspace */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {subTab === 'overview' && (
          <div className="space-y-6 animate-slide-up">
            {/* Mini metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">My Wallet Balance</span>
                <p className="mt-2 text-2xl font-black text-white">{user.credits} <span className="text-xs text-slate-500 font-normal">Credits</span></p>
                <span className="block mt-1 text-[9px] text-indigo-400 font-mono">~$1.00 = 100 Credits</span>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Executed Prompts</span>
                <p className="mt-2 text-2xl font-black text-white">{usageLogs.length}</p>
                <span className="block mt-1 text-[9px] text-slate-500 font-mono">Aggregate lifetime sessions</span>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Subscription Tier</span>
                <p className="mt-2 text-2xl font-black text-indigo-400 uppercase font-sans">{user.subscriptionPlan}</p>
                <span className="block mt-1 text-[9px] text-slate-500 font-mono">Expires: Annual Auto-renew</span>
              </div>
            </div>

            {/* Developer API Key Budget Tracker Card */}
            {apiKey && (
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-slate-900/50 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Key className="h-4 w-4 text-indigo-400" />
                      SaaS SDK Developer API Key Budget
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Your current active key is <code className="text-indigo-400 font-mono text-[9px] bg-indigo-950/40 px-1 py-0.5 rounded">{apiKey.substring(0, 10)}...</code>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-black text-white font-mono">
                      {(simulatedCallsCount + usageLogs.filter(l => l.toolId === 'developer-sdk').length).toLocaleString()} / {getApiBudget(user.subscriptionPlan).limit.toLocaleString()}
                    </span>
                    <p className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">monthly calls budget</p>
                  </div>
                </div>

                {(() => {
                  const apiLogs = usageLogs.filter(l => l.toolId === 'developer-sdk');
                  const currentApiCalls = simulatedCallsCount + apiLogs.length;
                  const budget = getApiBudget(user.subscriptionPlan);
                  const progressPct = Math.min((currentApiCalls / budget.limit) * 100, 100);
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${progressPct > 90 ? 'bg-rose-500 animate-pulse' : progressPct > 70 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          Plan Tier: <strong className="text-white font-mono">{budget.name}</strong>
                        </span>
                        <span className="text-slate-400 font-bold font-mono">
                          {progressPct.toFixed(2)}% Consumed
                        </span>
                      </div>
                      
                      <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                            progressPct > 90 ? 'from-rose-500 to-red-500' : progressPct > 70 ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-violet-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[9px] text-slate-500 font-mono pt-1">
                        <span>Remaining: {(budget.limit - currentApiCalls).toLocaleString()} calls</span>
                        <button 
                          onClick={() => setSubTab('api-keys')}
                          className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1 transition self-start sm:self-auto"
                        >
                          Configure API & Test Endpoint <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Usage Milestones Section */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-900/50 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    Usage Milestones & Lifetime Goals
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Track your overall AI model executions against lifetime reward targets</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white font-mono">{usageLogs.length} Completed</span>
                  <p className="text-[8px] text-slate-500 font-mono">lifetime generations</p>
                </div>
              </div>

              {/* Progress toward next goal */}
              {(() => {
                const milestones = [
                  { name: 'AI Explorer', target: 5, reward: '100 Bonus Credits Gift' },
                  { name: 'Power Creator', target: 15, reward: 'Unlock API Access' },
                  { name: 'AI Pioneer', target: 50, reward: 'ProDigital Video v2 Private Beta' },
                  { name: 'Supercomputer Overlord', target: 100, reward: 'Dedicated Cloud Nodes' },
                ];
                
                const currentMilestoneIndex = milestones.findIndex(m => usageLogs.length < m.target);
                const nextMilestone = currentMilestoneIndex !== -1 ? milestones[currentMilestoneIndex] : null;
                const prevTarget = currentMilestoneIndex > 0 ? milestones[currentMilestoneIndex - 1].target : 0;
                
                let percent = 100;
                if (nextMilestone) {
                  const range = nextMilestone.target - prevTarget;
                  const currentInRange = usageLogs.length - prevTarget;
                  percent = Math.min(Math.max((currentInRange / range) * 100, 0), 100);
                }

                return (
                  <div className="space-y-4">
                    {nextMilestone ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-sans flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-indigo-400" />
                            Next Goal: <strong className="text-white">{nextMilestone.name}</strong> ({nextMilestone.target} Generations)
                          </span>
                          <span className="font-bold text-indigo-400 font-mono">{Math.floor(percent)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Reward on completion: <strong className="text-amber-400 font-mono">{nextMilestone.reward}</strong> — Only <span className="font-extrabold text-white font-mono">{nextMilestone.target - usageLogs.length}</span> more generation{nextMilestone.target - usageLogs.length !== 1 ? 's' : ''} needed!
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-center">
                        <Award className="h-8 w-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ultimate AI Legend Reached!</h4>
                        <p className="text-[10px] text-slate-400 mt-1">You have exceeded all 100+ generations milestones. You represent the absolute peak of AI model automation!</p>
                      </div>
                    )}

                    {/* Timeline Grid of all Milestones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      {milestones.map((m, idx) => {
                        const isCompleted = usageLogs.length >= m.target;
                        const isCurrent = nextMilestone?.name === m.name;
                        return (
                          <div 
                            key={m.name} 
                            className={`rounded-xl border p-3 space-y-2 transition ${
                              isCompleted 
                                ? 'border-emerald-500/20 bg-emerald-500/[0.02]' 
                                : isCurrent
                                ? 'border-indigo-500/30 bg-indigo-500/[0.01]'
                                : 'border-slate-900 bg-slate-950'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-[9px] uppercase font-bold tracking-wider font-mono ${
                                isCompleted ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-500'
                              }`}>
                                Tier 0{idx + 1}
                              </span>
                              {isCompleted ? (
                                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : isCurrent ? (
                                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 animate-pulse text-[8px] font-black font-mono px-1">
                                  ACTV
                                </span>
                              ) : (
                                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-900 text-slate-600 text-[8px] font-black font-mono">
                                  LCK
                                </span>
                              )}
                            </div>
                            
                            <div>
                              <h4 className={`text-xs font-bold font-sans ${isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>{m.name}</h4>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Target: {m.target} generations</p>
                            </div>

                            <div className="text-[9px] text-slate-400 border-t border-slate-900/50 pt-1.5 truncate" title={m.reward}>
                              Reward: <span className="font-semibold text-slate-300">{m.reward}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 30-Day Credit Consumption Analytics */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900/50 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                    30-Day Credit Consumption Analytics
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Daily prompt tokens and credits consumed over the last 30 days</p>
                </div>
                {usageLogs.length > 0 && (
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Real-time Logs Integrated
                  </span>
                )}
              </div>

              {/* Recharts AreaChart for Daily AI Tool Usage Consumption */}
              <div className="h-52 w-full pr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={getChartData()}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#0f172a" strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#475569" 
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                      tickMargin={5}
                      minTickGap={20}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                      type="monotone" 
                      dataKey="credits" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCredits)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Usage Logs History Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Active Workspace Logs</h3>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 font-sans transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  EXPORT CSV
                </button>
              </div>
              
              {usageLogs.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono">No previous workspace executions on record.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">AI Model</th>
                        <th className="pb-3">Query Prompt</th>
                        <th className="pb-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {usageLogs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/10 transition">
                          <td className="py-3 font-mono text-[10px] text-slate-600">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 font-semibold text-slate-200">{log.toolTitle}</td>
                          <td className="py-3 max-w-[200px] truncate italic">{log.prompt}</td>
                          <td className="py-3 text-right font-mono font-bold text-rose-400">-{log.creditsSpent} credits</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT WALLET & TOP UP */}
        {subTab === 'billing' && (
          <div className="space-y-6 animate-slide-up">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-100">Wallet Recharge Center</h3>
                <p className="text-xs text-slate-500 mt-1">Acquire additional prompt tokens. Rates map cleanly at $1.00 USD = 100 Credits.</p>
              </div>

              {/* Package Select Preset Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { title: 'Lite Taster', credits: 500, price: '$5' },
                  { title: 'Power Creator', credits: 2000, price: '$15', popular: true },
                  { title: 'Startup Hub', credits: 5000, price: '$35' },
                  { title: 'Enterprise', credits: 15000, price: '$90' }
                ].map((pkg, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setTopupAmount(pkg.credits)}
                    className={`rounded-2xl border p-4 text-center flex flex-col justify-between relative transition ${
                      topupAmount === pkg.credits
                        ? 'border-indigo-500 bg-indigo-500/[0.03] shadow-lg shadow-indigo-500/[0.01]'
                        : 'border-slate-900 bg-slate-900/20 hover:border-slate-800'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute top-2 right-2 text-[7px] font-black uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded">Best value</span>
                    )}
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-500 uppercase">{pkg.title}</span>
                      <p className="mt-2 text-base font-black text-white">{pkg.credits} <span className="text-[10px] font-normal text-slate-500">Credits</span></p>
                    </div>
                    <span className="block mt-4 text-xs font-bold text-indigo-400 font-mono">{pkg.price}</span>
                  </button>
                ))}
              </div>

              {/* Checkout Form simulation */}
              <form onSubmit={handleTopupSubmit} className="border-t border-slate-900 pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Custom top-up field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Credits Amount</label>
                    <input 
                      type="number" 
                      min="100"
                      step="100"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Payment gateway provider selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gateway Processor</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['stripe', 'paypal', 'crypto'] as const).map(method => (
                        <button
                          type="button"
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`rounded-xl border py-2.5 text-center text-xs font-bold uppercase transition ${
                            paymentMethod === method 
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                              : 'border-slate-850 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900/20 border border-slate-900 rounded-xl p-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="block text-slate-500 uppercase text-[9px] tracking-wider font-mono">Total Transaction Cost</span>
                    <span className="font-extrabold text-white text-sm font-mono">${(topupAmount / 100).toFixed(2)} USD</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTopup || topupAmount <= 0}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold px-6 py-3 transition"
                  >
                    {submittingTopup ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                    Checkout Wallet Top-up
                  </button>
                </div>
              </form>
            </div>

            {/* Refer a Friend & Get Rewards Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-emerald-400 animate-pulse" />
                    Refer a Friend & Earn 350 Credits
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Share the power of PRO DIGITAL™ with friends. They receive 150 extra startup credits, and you earn 350 credits.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-extrabold text-emerald-400 font-mono uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Unlimited Rewards Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats / How It Works */}
                <div className="md:col-span-1 space-y-4 border-r border-slate-900 pr-0 md:pr-6">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">How it works</span>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-slate-400 border border-slate-800">1</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Copy your personalized referral link below and send it to friends.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-slate-400 border border-slate-800">2</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Your friend registers an account using your referral link.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">3</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        They start with <span className="text-emerald-400 font-bold">650 credits</span> instead of 500, and <span className="text-indigo-400 font-bold">350 bonus credits</span> instantly credit your wallet!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Action Area */}
                <div className="md:col-span-2 space-y-4 bg-slate-900/10 rounded-xl p-5 border border-slate-900/60 flex flex-col justify-between">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Unique Referral Link</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={user ? `${window.location.origin}/?ref=${user.id}` : 'Login to generate link'}
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 font-mono select-all focus:outline-none focus:border-indigo-500 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-2.5 text-xs transition flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {copiedReferral ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <p className="text-[10px] text-slate-500">
                      We also support email-based referrals. Your friend can also type your registered email address <code className="text-indigo-400 font-mono font-bold bg-indigo-500/5 px-1.5 py-0.5 rounded">{user?.email}</code> as the referral code on registration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo / Voucher Code Activation Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Promo & Voucher Activation
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Have a special voucher or promotional code? Enter it below to unlock premium access plans or claim bonus wallet credits instantly! Try entering <code className="text-indigo-400 font-semibold font-mono">PRO DIGITAL</code>!
                </p>
              </div>

              <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. PRO DIGITAL"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingPromo || !promoCode}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold px-6 py-2.5 text-xs transition shrink-0 flex items-center justify-center gap-2"
                >
                  {submittingPromo ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  Activate Promo Code
                </button>
              </form>

              {promoSuccess && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 font-sans">
                  {promoSuccess}
                </div>
              )}

              {promoError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-400 font-sans">
                  {promoError}
                </div>
              )}
            </div>

            {/* Billing Transactions Logs */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Topup & Bonus Transactions History</h3>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 font-sans transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  EXPORT CSV
                </button>
              </div>
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono">No financial transaction history available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="pb-3">Timestamp</th>
                        <th className="pb-3">Action Description</th>
                        <th className="pb-3">Source Type</th>
                        <th className="pb-3 text-right">Credits Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/10 transition">
                          <td className="py-3 font-mono text-[10px] text-slate-600">{new Date(tx.timestamp).toLocaleDateString()}</td>
                          <td className="py-3 font-semibold text-slate-200">{tx.description}</td>
                          <td className="py-3 uppercase font-mono text-[9px]">
                            <span className={`px-1.5 py-0.5 rounded border ${
                              tx.type === 'purchase' ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10' : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credits
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DEVELOPER API KEYS */}
        {subTab === 'api-keys' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="border-b border-slate-900 pb-4">
              <h3 className="text-sm font-black text-slate-100">SaaS Developer API Credentials</h3>
              <p className="text-xs text-slate-500 mt-1">Integrate PRO DIGITAL™ models into your local workflows and web terminals.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Production Private Key</label>
                <div className="flex rounded-xl border border-slate-800 bg-slate-900/60 p-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    className="w-full bg-transparent px-3 text-xs text-indigo-300 font-mono focus:outline-none"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3 py-1 text-[10px] font-bold font-mono transition"
                    >
                      {showApiKey ? 'HIDE' : 'SHOW'}
                    </button>
                    <button
                      type="button"
                      onClick={copyKeyToClipboard}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white p-2 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={generateNewApiKey}
                  className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition"
                >
                  Rotate Key Credentials
                </button>
              </div>
            </div>

            {/* Real-time API Key Budget Tracking & Testing Sandbox */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-900/50 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Personal API Key Budget Tracker
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Monitor consumption and execute endpoint tests in the live sandbox.</p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20 uppercase self-start sm:self-auto">
                  Active Connection
                </span>
              </div>

              {(() => {
                const apiLogs = usageLogs.filter(l => l.toolId === 'developer-sdk');
                const totalCalls = simulatedCallsCount + apiLogs.length;
                const budget = getApiBudget(user.subscriptionPlan);
                const progressPct = Math.min((totalCalls / budget.limit) * 100, 100);

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Progress Gauge */}
                    <div className="lg:col-span-7 space-y-3.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Monthly Usage:</span>
                        <span className="text-white font-bold">{totalCalls.toLocaleString()} / {budget.limit.toLocaleString()} requests</span>
                      </div>

                      <div className="h-3.5 w-full rounded-full bg-slate-950 p-0.5 border border-slate-900 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                            progressPct > 90 ? 'from-rose-500 to-red-500 animate-pulse' : progressPct > 70 ? 'from-amber-500 to-orange-500' : 'from-indigo-500 to-emerald-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono pt-1">
                        <div className="rounded-lg bg-slate-950/40 p-2 border border-slate-900">
                          <span className="block text-slate-500 text-[8px] uppercase">Plan Limit</span>
                          <span className="font-bold text-white text-xs">{budget.limit.toLocaleString()} / mo</span>
                        </div>
                        <div className="rounded-lg bg-slate-950/40 p-2 border border-slate-900">
                          <span className="block text-slate-500 text-[8px] uppercase">Available Budget</span>
                          <span className="font-bold text-emerald-400 text-xs">{(budget.limit - totalCalls).toLocaleString()} left</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Sandbox Interactive Button */}
                    <div className="lg:col-span-5 rounded-xl border border-slate-900 bg-slate-950 p-4 space-y-3">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Developer Playground</span>
                      <p className="text-[10px] text-slate-500">
                        Dispatch a simulated client SDK query to verify server-side authentication and model responses. Cost: <strong className="text-rose-400 font-mono">5 Credits</strong>
                      </p>

                      <button
                        type="button"
                        onClick={handleSimulateApiCall}
                        disabled={apiTesting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-2 text-xs transition"
                      >
                        {apiTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                        Send Test Request via API
                      </button>

                      {apiTestSuccess && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[9px] text-emerald-400 font-mono">
                          {apiTestSuccess}
                        </div>
                      )}

                      {apiTestError && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-[9px] text-rose-400 font-mono">
                          {apiTestError}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Quick curl specs */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Sample cURL Integration request</h4>
              </div>
              
              <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto text-[10px] font-mono text-slate-400 leading-relaxed border border-slate-900">
{`curl -X POST "https://api.prodigital.net/v1/execute" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_slug": "prodigital-chat-ultra",
    "prompt": "Explain Quantum Entanglement in one short sentence."
  }'`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
