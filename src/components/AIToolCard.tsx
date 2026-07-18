import React from 'react';
import { Star, Users, Eye, ArrowRight, Heart, Sparkles, Check, DollarSign } from 'lucide-react';
import { AITool, User } from '../types';

interface AIToolCardProps {
  key?: React.Key;
  tool: AITool;
  user: User | null;
  purchasedToolIds: string[];
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onViewDetails: (slug: string) => void;
  onUseNow: (tool: AITool) => void;
  onPurchase: (tool: AITool) => void;
}

export default function AIToolCard({
  tool,
  user,
  purchasedToolIds,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onUseNow,
  onPurchase
}: AIToolCardProps) {
  const isOwned = purchasedToolIds.includes(tool.id) || tool.type === 'free';
  const priceDisplay = tool.type === 'free' ? 'Free' : `$${tool.price}`;
  
  const getTierColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pro': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'business': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div 
      className="group relative flex flex-col rounded-2xl border border-slate-900 bg-slate-950 p-4 transition-all duration-300 hover:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/[0.02] hover:-translate-y-0.5"
      id={`tool-card-${tool.id}`}
    >
      {/* Thumbnail Banner */}
      <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-900">
        <img 
          src={tool.image} 
          alt={tool.title} 
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Aspect Aspect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        
        {/* Tier Badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`rounded-md border px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider ${getTierColor(tool.type)}`}>
            {tool.type}
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-slate-300">
            {tool.category}
          </span>
        </div>

        {/* Favorite heart */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(tool.id); }}
          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 ${
            isFavorite 
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-500' 
              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 mt-4 flex flex-col">
        {/* Title & Price */}
        <div className="flex items-start justify-between">
          <h3 
            onClick={() => onViewDetails(tool.slug)}
            className="text-sm font-bold text-slate-100 hover:text-indigo-400 transition cursor-pointer"
          >
            {tool.title}
          </h3>
          <span className="text-sm font-black text-indigo-400 font-mono">
            {priceDisplay}
          </span>
        </div>

        {/* Short description */}
        <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
          {tool.description}
        </p>

        {/* Stats segment */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-900 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-slate-300">{tool.rating}</span>
            <span>(rating)</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-bold text-slate-300">{tool.users}</span>
            <span>active users</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button 
            onClick={() => onViewDetails(tool.slug)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </button>

          {isOwned ? (
            <button 
              onClick={() => onUseNow(tool)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/10 transition"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Use Now
            </button>
          ) : (
            <button 
              onClick={() => onPurchase(tool)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-600 hover:text-white transition px-3 py-2 text-xs font-extrabold"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Subscribe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
