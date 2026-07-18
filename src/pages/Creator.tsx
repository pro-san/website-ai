import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Hammer, Plus, HelpCircle, RefreshCw, BarChart2, 
  Trash2, Eye, DollarSign, CheckCircle2, AlertCircle, ShoppingBag, ListPlus 
} from 'lucide-react';
import { AITool, Category, Order, User } from '../types';

interface CreatorProps {
  user: User | null;
  tools: AITool[];
  categories: Category[];
  token: string | null;
  onRefreshTools: () => void;
}

export default function Creator({ user, tools, categories, token, onRefreshTools }: CreatorProps) {
  const [subTab, setSubTab] = useState<'products' | 'submit-tool' | 'orders'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Form State for New Tool
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('AI Chat');
  const [price, setPrice] = useState(15);
  const [type, setType] = useState<'free' | 'pro' | 'business'>('pro');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');

  // Feature Bullet points list
  const [features, setFeatures] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['Active internet connection']);

  const [submitting, setSubmitting] = useState(false);

  // Fetch creator orders analytics
  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-sm font-bold text-slate-500">Please sign in to access creator tools.</p>
      </div>
    );
  }

  // Filter tools owned/published by this creator
  const myTools = tools.filter(t => t.creatorId === user.id || user.role === 'admin');

  // Filter orders on tools published by this creator
  const myToolIds = myTools.map(t => t.id);
  const myOrders = orders.filter(o => myToolIds.includes(o.toolId));

  // Revenue analytics totals
  const totalRevenue = myOrders.reduce((sum, o) => sum + o.amount, 0);

  // Handle Dynamic Feature points
  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleAddFeatureField = () => setFeatures([...features, '']);
  const handleRemoveFeatureField = (index: number) => {
    const updated = [...features];
    updated.splice(index, 1);
    setFeatures(updated);
  };

  // Form submit handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!title.trim() || !description.trim()) {
      alert('Title and Description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          longDescription: longDescription || description,
          image,
          category,
          price: type === 'free' ? 0 : price,
          type,
          features: features.filter(f => f.trim()),
          requirements: requirements.filter(r => r.trim()),
          demoVideoUrl
        })
      });

      if (res.ok) {
        alert('AI Tool published successfully! Approved models will go live immediately.');
        // Reset fields
        setTitle('');
        setDescription('');
        setLongDescription('');
        setImage('');
        setPrice(15);
        setType('pro');
        setFeatures(['']);
        onRefreshTools();
        setSubTab('products');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit AI Tool.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to publishing service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16">
      
      {/* 1. Creator Sub-navigation Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-3">
          <div className="px-3 py-2 border-b border-slate-900">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Creator Workspace</h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Control models and revenue</p>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSubTab('products')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'products'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              My AI Products
            </button>

            <button
              onClick={() => setSubTab('submit-tool')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'submit-tool'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <Plus className="h-4 w-4" />
              Submit AI Tool
            </button>

            <button
              onClick={() => setSubTab('orders')}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-xs font-bold text-left transition ${
                subTab === 'orders'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white border border-slate-900'
              }`}
            >
              <BarChart2 className="h-4 w-4" />
              Conversions & Sales
            </button>
          </div>
        </div>

        {/* Total Revenue Stats widget */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-center space-y-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Gross Earnings Revenue</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">${totalRevenue.toFixed(2)} USD</p>
          <span className="block text-[8px] text-slate-600 font-mono">Orders processed: {myOrders.length}</span>
        </div>
      </div>

      {/* 2. Main Creator content area panel */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* SUBTAB 1: PRODUCTS LIST */}
        {subTab === 'products' && (
          <div className="space-y-6 animate-slide-up">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">My Published AI Models</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tracking approvals and active catalog status</p>
                </div>
                <button 
                  onClick={() => setSubTab('submit-tool')}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <ListPlus className="h-4 w-4" />
                  Add Tool
                </button>
              </div>

              {myTools.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 font-mono">
                  No published AI models on file. Go to "Submit AI Tool" to list your first!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono pb-3">
                        <th className="pb-3">Thumbnail</th>
                        <th className="pb-3">Model Name</th>
                        <th className="pb-3">Specialty Node</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Approval State</th>
                        <th className="pb-3 text-right">Active Users</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {myTools.map((tool) => (
                        <tr key={tool.id} className="hover:bg-slate-900/10 transition">
                          <td className="py-3">
                            <img src={tool.image} alt={tool.title} className="h-8 w-12 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                          </td>
                          <td className="py-3 font-semibold text-slate-200">{tool.title}</td>
                          <td className="py-3 font-mono text-[10px]">{tool.category}</td>
                          <td className="py-3 font-mono font-bold text-white">{tool.price === 0 ? 'Free' : `$${tool.price}`}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              tool.status === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : tool.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {tool.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-indigo-400">{tool.users} users</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: SUBMIT NEW TOOL FORM */}
        {subTab === 'submit-tool' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6 animate-slide-up">
            <div className="border-b border-slate-900 pb-4">
              <h3 className="text-sm font-black text-slate-100">Submit AI Model Specification</h3>
              <p className="text-xs text-slate-500 mt-1">Specify parameters to deploy a custom LLM assistant or image generator.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model Title Name</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ProDigital Copywriter Ultra"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specialty Category Node</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brief Concept Description</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Fine-tuned Gemini 3.5 model for high-converting marketing hooks..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Model Documentation Specifications</label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Provide deep architectural overview, fine-tuning specifications, or input expectations..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pricing Subscription Tier</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="free">Free Access</option>
                    <option value="pro">Pro Developer ($10-$29)</option>
                    <option value="business">Enterprise Business ($30-$99)</option>
                  </select>
                </div>

                {type !== 'free' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subscription Cost ($ USD / Month)</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cover Image URL (Unsplash photorealistic recommended)</label>
                  <input 
                    type="url" 
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Demo Video MP4 URL (Optional)</label>
                  <input 
                    type="url" 
                    value={demoVideoUrl}
                    onChange={(e) => setDemoVideoUrl(e.target.value)}
                    placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Feature tag bullets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model Capability Tags</label>
                  <button 
                    type="button" 
                    onClick={handleAddFeatureField}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    + Add bullet point
                  </button>
                </div>
                
                <div className="space-y-2">
                  {features.map((feat, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={feat}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder={`Bullet point ${idx + 1}`}
                        className="w-full rounded-xl border border-slate-850 bg-slate-900/20 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      {features.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFeatureField(idx)}
                          className="text-slate-500 hover:text-rose-400 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold px-6 py-3 text-xs transition"
                >
                  {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Hammer className="h-4 w-4" />}
                  Deploy Model Specification
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBTAB 3: ORDERS & CONVERSIONS */}
        {subTab === 'orders' && (
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 animate-slide-up">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Purchase Conversion Logs</h3>
            <p className="text-xs text-slate-500">Real-time buyer settlements aligned via PayPal or Stripe processors.</p>
            
            {loadingOrders ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            ) : myOrders.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono py-6">No purchases logged for your published models.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono pb-3">
                      <th className="pb-3">Transaction ID</th>
                      <th className="pb-3">Buyer Email</th>
                      <th className="pb-3">AI Model</th>
                      <th className="pb-3">Payment Source</th>
                      <th className="pb-3 text-right">Settled Gross</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {myOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/10 transition">
                        <td className="py-3 font-mono text-[10px] text-slate-600">{ord.id}</td>
                        <td className="py-3 text-slate-300 font-semibold">{ord.userEmail}</td>
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
