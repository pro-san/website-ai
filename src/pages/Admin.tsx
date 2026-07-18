import React, { useState, useEffect } from 'react';
import { 
  Users, Hammer, ShieldAlert, FileCheck, Check, X, AlertOctagon, 
  RefreshCw, Terminal, Eye, DollarSign, Activity, Globe 
} from 'lucide-react';
import { AITool, User, Order } from '../types';

interface AdminProps {
  user: User | null;
  tools: AITool[];
  token: string | null;
  onRefreshTools: () => void;
}

export default function Admin({ user, tools, token, onRefreshTools }: AdminProps) {
  const [subTab, setSubTab] = useState<'users' | 'approvals' | 'transactions'>('users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchAdminDetails = async () => {
    if (!token) return;
    try {
      const [uRes, oRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (uRes.ok) setAllUsers(await uRes.json());
      if (oRes.ok) setAllOrders(await oRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminDetails();
  }, [token, tools]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-24 space-y-4">
        <AlertOctagon className="h-10 w-10 text-rose-500 mx-auto animate-bounce" />
        <p className="text-sm font-bold text-slate-300">Access Denied: Administrative Credentials Required.</p>
      </div>
    );
  }

  // Handle User Role update
  const handleUpdateRole = async (userId: string, newRole: 'user' | 'creator' | 'admin') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        alert('User role updated successfully.');
        fetchAdminDetails();
      } else {
        alert('Failed updating user role.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle user suspension toggle
  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    if (!token) return;
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    
    if (userId === user.id) {
      alert('You cannot suspend your own administrative session!');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        alert(`Account ${nextStatus === 'suspended' ? 'Suspended' : 'Activated'} successfully!`);
        fetchAdminDetails();
      } else {
        alert('Failed toggling account suspension status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Creator Tool approval / rejection
  const handleApproveTool = async (toolId: string, action: 'approved' | 'rejected') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/tools/${toolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        alert(`Tool status configured as: ${action.toUpperCase()}`);
        onRefreshTools();
      } else {
        alert('Failed configuring tool status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingTools = tools.filter(t => t.status === 'pending');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16">
      
      {/* 1. Admin Navigation Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-3">
          <div className="px-3 py-2 border-b border-slate-900">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Admin Console</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Control roles and model approvals</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSubTab('users')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'users'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              User Directory
            </button>

            <button
              onClick={() => setSubTab('approvals')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left relative transition ${
                subTab === 'approvals'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <FileCheck className="h-4 w-4" />
              Pending Approvals
              {pendingTools.length > 0 && (
                <span className="absolute right-3 top-3.5 h-4 w-4 rounded-full bg-rose-500 text-[8px] font-black flex items-center justify-center text-white animate-pulse">
                  {pendingTools.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab('transactions')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'transactions'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <Activity className="h-4 w-4" />
              Full System Purchases
            </button>
          </div>
        </div>

        {/* System metrics summary */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-4">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">System Telemetry</h4>
          
          <div className="space-y-2.5 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>ACTIVE CLIENTS:</span>
              <span className="font-bold text-white">{allUsers.length} Users</span>
            </div>
            <div className="flex justify-between">
              <span>DEPLOYED MODELS:</span>
              <span className="font-bold text-indigo-400">{tools.length} Deployed</span>
            </div>
            <div className="flex justify-between">
              <span>SATELLITE SECTOR:</span>
              <span className="font-bold text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Admin Workspace panel */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* SUBTAB 1: USER MANAGEMENT DIRECTORY */}
        {subTab === 'users' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 animate-slide-up">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">System User Directory</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Edit user roles and manage suspension toggles</p>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono pb-3">
                      <th className="pb-3">User Details</th>
                      <th className="pb-3">Subscription</th>
                      <th className="pb-3">Wallet Credits</th>
                      <th className="pb-3">Role Authority</th>
                      <th className="pb-3 text-right">Actions Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/10 transition">
                        <td className="py-3 flex items-center gap-2.5">
                          <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                          <div>
                            <span className="block font-semibold text-slate-200">{u.name}</span>
                            <span className="block text-[9px] text-slate-600 truncate max-w-[150px]">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-3 uppercase font-mono text-[10px] text-slate-300">{u.subscriptionPlan}</td>
                        <td className="py-3 font-mono text-white font-bold">{u.credits} credits</td>
                        <td className="py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                            className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase text-indigo-400 focus:outline-none"
                          >
                            <option value="user">User</option>
                            <option value="creator">Creator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleSuspend(u.id, u.status)}
                            className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase transition border ${
                              u.status === 'suspended'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                            }`}
                          >
                            {u.status === 'suspended' ? 'UNSUSPEND' : 'SUSPEND'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: CREATOR PENDING TOOLS APPROVAL PIPELINE */}
        {subTab === 'approvals' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 animate-slide-up">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pending Approvals Queue</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Inspect and deploy custom models submitted by platform Creators</p>
            </div>

            {pendingTools.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono py-6 text-center">No tools currently pending approval. Pipeline clear.</p>
            ) : (
              <div className="space-y-4">
                {pendingTools.map((tool) => (
                  <div key={tool.id} className="rounded-xl border border-slate-900 bg-slate-900/10 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-3">
                        <img src={tool.image} alt={tool.title} className="h-9 w-14 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-200">{tool.title}</h4>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{tool.category}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleApproveTool(tool.id, 'approved')}
                          className="flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-[10px] font-extrabold transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveTool(tool.id, 'rejected')}
                          className="flex items-center gap-1 rounded border border-slate-850 hover:bg-rose-500/10 hover:text-rose-300 text-slate-400 px-3 py-1.5 text-[10px] font-semibold transition"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                      <p><span className="font-bold text-slate-300">Brief:</span> {tool.description}</p>
                      <p><span className="font-bold text-slate-300">Specifications:</span> {tool.longDescription}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: SYSTEM TRANSACTIONS AND ORDERS TABLE */}
        {subTab === 'transactions' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 animate-slide-up">
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">System-wide Purchases History</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Audited log registers of subscription purchases and credits buyouts</p>
            </div>

            {allOrders.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono py-6 text-center">No platform order transactions logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono pb-3">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Buyer Email</th>
                      <th className="pb-3">AI Model</th>
                      <th className="pb-3">Processor</th>
                      <th className="pb-3 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {allOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/10 transition">
                        <td className="py-3 font-mono text-[10px] text-slate-600">{ord.id}</td>
                        <td className="py-3 font-semibold text-slate-200">{ord.userEmail}</td>
                        <td className="py-3 font-mono text-[10px]">{ord.toolTitle}</td>
                        <td className="py-3 uppercase font-mono text-[9px]">{ord.paymentMethod}</td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-400">+${ord.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
