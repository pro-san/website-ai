import React, { useState, useEffect } from 'react';
import { Star, ArrowLeft, ShieldCheck, CheckCircle, Download, FileText, Globe, Heart, Play, RefreshCw, Send, Sparkles, Video, User as UserIcon } from 'lucide-react';
import { AITool, Review, User } from '../types';

interface ToolDetailProps {
  slug: string;
  tools: AITool[];
  user: User | null;
  purchasedToolIds: string[];
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onBack: () => void;
  onUseNow: (tool: AITool) => void;
  onPurchase: (tool: AITool) => void;
  token: string | null;
}

export default function ToolDetail({
  slug,
  tools,
  user,
  purchasedToolIds,
  favorites,
  onToggleFavorite,
  onBack,
  onUseNow,
  onPurchase,
  token
}: ToolDetailProps) {
  const tool = tools.find(t => t.slug === slug);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // New Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!tool) return;
    
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews/${tool.id}`);
        if (res.ok) {
          setReviews(await res.json());
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [tool]);

  if (!tool) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-sm font-bold text-slate-300">AI Tool not found in catalog.</p>
        <button onClick={onBack} className="text-xs text-indigo-400 hover:underline">Return to Marketplace</button>
      </div>
    );
  }

  const isOwned = purchasedToolIds.includes(tool.id) || tool.type === 'free';
  const isFavorite = favorites.includes(tool.id);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You must be signed in to submit reviews.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toolId: tool.id,
          rating: newRating,
          comment: newComment
        })
      });

      if (res.ok) {
        const addedReview = await res.json();
        setReviews(prev => [addedReview, ...prev]);
        setNewComment('');
        setNewRating(5);
        // Alert completion
        alert('Review published successfully!');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Recommendations (similar tools in same category)
  const similarTools = tools
    .filter(t => t.category === tool.category && t.id !== tool.id && t.status === 'approved')
    .slice(0, 3);

  return (
    <div className="space-y-10 pb-20">
      {/* Back breadcrumb */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        Back to AI Marketplace
      </button>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Visual Header */}
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-slate-900 bg-slate-900 shadow-2xl">
            <img 
              src={tool.image} 
              alt={tool.title} 
              className="h-full w-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <span className="rounded-md bg-indigo-500/25 border border-indigo-500/30 px-2.5 py-0.5 text-[9px] uppercase font-black tracking-widest text-indigo-300">
                  {tool.category}
                </span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{tool.title}</h1>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onToggleFavorite(tool.id)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition ${
                    isFavorite 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                
                {isOwned ? (
                  <button 
                    onClick={() => onUseNow(tool)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2 text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                  >
                    <Sparkles className="h-4 w-4 animate-spin-slow" />
                    Launch Workspace
                  </button>
                ) : (
                  <button 
                    onClick={() => onPurchase(tool)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-2 text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                  >
                    Subscribe (${tool.price})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Long Description and Features */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Specifications & Documentation</h2>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{tool.longDescription}</p>
            </div>

            <div className="border-t border-slate-900 pt-6 space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Key Feature Capabilities</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                {tool.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <CheckCircle className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Demo Video Frame */}
          {tool.demoVideoUrl && (
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Video className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Demo Video</h3>
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-850">
                <video 
                  src={tool.demoVideoUrl} 
                  controls 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-8">
            <div className="flex justify-between items-center border-b border-slate-900 pb-4">
              <div className="flex items-center gap-2">
                <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Reviews ({reviews.length})</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Average Rating: {tool.rating}/5★</span>
            </div>

            {/* Write Review Form */}
            {user ? (
              <form onSubmit={handleReviewSubmit} className="bg-slate-900/40 rounded-xl border border-slate-850 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rate this model:</span>
                  <div className="flex gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-0.5 focus:outline-none hover:scale-110 transition"
                      >
                        <Star className={`h-4 w-4 ${newRating >= star ? 'fill-current' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Provide a constructive, detailed review of this AI node..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview || !newComment.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold px-4 py-1.5 text-xs transition"
                  >
                    {submittingReview ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Publish Review
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center bg-slate-900/20 border border-dashed border-slate-850 p-4 rounded-xl text-xs text-slate-500">
                Please <span className="text-indigo-400 hover:underline cursor-pointer">sign in</span> to leave comments or review ratings.
              </div>
            )}

            {/* Render reviews */}
            {loadingReviews ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">No reviews published yet for this tool. Be the first!</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-slate-900 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <img src={rev.userAvatar} alt={rev.userName} className="h-8 w-8 rounded-full border border-slate-800 object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{rev.userName}</h4>
                          <span className="text-[9px] font-mono text-slate-500">{new Date(rev.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${rev.rating > i ? 'fill-current' : 'text-slate-850'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed pl-10">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Specifications */}
        <div className="space-y-6">
          {/* Purchase Details Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Subscription Specifications</h3>
            
            <div className="space-y-2.5 text-xs border-y border-slate-900 py-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Pricing Model:</span>
                <span className="font-bold text-indigo-400 uppercase">{tool.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchase Price:</span>
                <span className="font-mono font-bold text-white">{tool.type === 'free' ? 'Free' : `$${tool.price}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Users:</span>
                <span className="font-mono text-slate-300 font-semibold">{tool.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Rating:</span>
                <span className="font-mono text-amber-500 font-bold">{tool.rating}★</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {isOwned ? (
                <button 
                  onClick={() => onUseNow(tool)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/10 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Launch Active Workspace
                </button>
              ) : (
                <button 
                  onClick={() => onPurchase(tool)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 text-xs shadow-lg shadow-indigo-600/10 transition"
                >
                  Unlock Access License
                </button>
              )}
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>30-Day Money Back Guarantee</span>
              </div>
            </div>
          </div>

          {/* System Requirements */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Requirements</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {tool.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations list */}
          {similarTools.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Related AI Models</h3>
              <div className="space-y-3">
                {similarTools.map((sim) => (
                  <div 
                    key={sim.id}
                    onClick={() => onBack()} // simple trigger or redirecting
                    className="flex items-center gap-3 rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-indigo-500/30 cursor-pointer transition"
                  >
                    <img src={sim.image} alt={sim.title} className="h-10 w-10 rounded-lg object-cover border border-slate-850" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{sim.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-0.5">{sim.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
