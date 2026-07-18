import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Star, Sparkles } from 'lucide-react';
import { AITool, Category, User } from '../types';
import AIToolCard from '../components/AIToolCard';

interface ToolsProps {
  tools: AITool[];
  categories: Category[];
  user: User | null;
  purchasedToolIds: string[];
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onViewDetails: (slug: string) => void;
  onUseNow: (tool: AITool) => void;
  onPurchase: (tool: AITool) => void;
}

export default function Tools({
  tools,
  categories,
  user,
  purchasedToolIds,
  favorites,
  onToggleFavorite,
  onViewDetails,
  onUseNow,
  onPurchase
}: ToolsProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered and Sorted list
  const filteredTools = useMemo(() => {
    let result = tools.filter(t => t.status === 'approved');

    // Search query match
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(t => t.category === selectedCategory);
    }

    // Pricing type Filter
    if (selectedType !== 'All') {
      result = result.filter(t => t.type === selectedType);
    }

    // Rating Filter
    if (minRating > 0) {
      result = result.filter(t => t.rating >= minRating);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.users - a.users;
        case 'rating':
          return b.rating - a.rating;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [tools, search, selectedCategory, selectedType, minRating, sortBy]);

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedType('All');
    setMinRating(0);
    setSortBy('popular');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Search Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 px-6 py-12 text-center md:px-12 md:py-16">
        <div className="absolute -left-1/4 -top-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Model Marketplace</span>
          <h1 className="text-3xl font-extrabold text-white md:text-4xl">Explore Custom AI Node Modules</h1>
          <p className="text-xs text-slate-400">Discover and execute specific, fine-tuned artificial intelligence models directly in your browser.</p>
          
          {/* Main Search Input */}
          <div className="mt-8 flex rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-1.5 shadow-2xl">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search AI Copywriters, Diffusion Art Generators, Chatbots..."
                className="w-full bg-transparent py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter drawer/panel (collapsible) */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 grid grid-cols-1 sm:grid-cols-4 gap-6 animate-slide-down">
          {/* Categories */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specialty Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Pricing tier type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pricing Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Tiers</option>
              <option value="free">Free Only</option>
              <option value="pro">Pro Only</option>
              <option value="business">Business Only</option>
            </select>
          </div>

          {/* Ratings slider */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Minimum Rating</label>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold transition ${
                    minRating === rating 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                      : 'border-slate-850 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {rating === 0 ? 'Any' : `${rating}★`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sort Arrangement</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Recently Approved</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Category Horizontal Scrolling Pill Rail */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => setSelectedCategory('All')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'All' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.name 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white hover:border-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid Results */}
      {filteredTools.length === 0 ? (
        <div className="rounded-3xl border border-slate-900 bg-slate-950 py-16 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">No matching AI models found</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">We couldn't locate any tools matching your specific search query, filters, or minimum ratings.</p>
          </div>
          <button 
            onClick={clearAllFilters}
            className="rounded-xl border border-slate-800 hover:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 transition"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>SHOWING {filteredTools.length} VERIFIED AI TOOLS</span>
            {selectedCategory !== 'All' && <span>SPECIALTY: {selectedCategory.toUpperCase()}</span>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <AIToolCard 
                key={tool.id}
                tool={tool}
                user={user}
                purchasedToolIds={purchasedToolIds}
                isFavorite={favorites.includes(tool.id)}
                onToggleFavorite={onToggleFavorite}
                onViewDetails={onViewDetails}
                onUseNow={onUseNow}
                onPurchase={onPurchase}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
