import React, { useState } from 'react';
import { Sparkles, MessageSquare, Shield, Cpu, Code, Mic, Video, Image as ImageIcon, Check, HelpCircle, ArrowRight, Star, Users, Play, ExternalLink } from 'lucide-react';
import { AITool, Category } from '../types';

interface HomeProps {
  categories: Category[];
  approvedTools: AITool[];
  setActiveTab: (tab: any) => void;
  setSelectedToolSlug: (slug: string) => void;
  onQuickUse: (tool: AITool) => void;
}

export default function Home({
  categories,
  approvedTools,
  setActiveTab,
  setSelectedToolSlug,
  onQuickUse
}: HomeProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const stats = [
    { label: 'Verified AI Tools', value: '450+' },
    { label: 'Active Developers', value: '85K+' },
    { label: 'Tokens Processed', value: '1.2B+' },
    { label: 'Satisfied Creators', value: '99.4%' }
  ];

  const faqs = [
    {
      q: 'What is PRO DIGITAL™ AI Marketplace?',
      a: 'PRO DIGITAL™ is an advanced, production-grade SaaS repository of pre-trained and specialized artificial intelligence models. Developers and content creators can search, integrate, subscribe to, and execute micro-AI models directly inside their workspace.'
    },
    {
      q: 'How does the Credit Wallet and subscription plans operate?',
      a: 'Free accounts are pre-allocated 500 sign-up credits. Different operations (e.g. copywriting, synthetic voiceovers, diffusion images) deduct custom tokens. You can upgrade to a monthly plan (Pro or Business) to get massive recurring credits or easily buy credits directly from your dashboard.'
    },
    {
      q: 'Can I publish my own AI models and monetize them?',
      a: 'Absolutely. Creators can apply to upgrade their role. Once approved, the Creator Panel allows publishing private models, defining pricing models (free vs premium), and viewing deep buyer analytics logs.'
    },
    {
      q: 'Is my input data protected and encrypted?',
      a: 'Yes, all prompts and uploaded payloads are transmitted via SSL and processed using secure, server-side sandboxes. Credits transactions and wallet keys are fully audited under TLS protocols.'
    }
  ];

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare className="h-5 w-5" />;
      case 'FileText': return <Cpu className="h-5 w-5 text-indigo-400" />;
      case 'Image': return <ImageIcon className="h-5 w-5 text-purple-400" />;
      case 'Video': return <Video className="h-5 w-5 text-teal-400" />;
      case 'Mic': return <Mic className="h-5 w-5 text-amber-400" />;
      case 'Code': return <Code className="h-5 w-5 text-blue-400" />;
      default: return <Sparkles className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-24 pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-16 border-b border-slate-900/50">
        {/* Glow visual backdrops */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering 85,000+ Digital Creators Globally
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Discover and Execute <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Premium AI Tools</span> in Real-Time
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to PRO DIGITAL™. Subscribe, integrate, and execute cutting-edge models for copywriting, photorealistic latent diffusion, video rendering, and neural text-to-speech.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button 
              onClick={() => setActiveTab('tools')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-8 py-3.5 text-sm shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
            >
              Explore AI Marketplace
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => setActiveTab('tools')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200 px-8 py-3.5 text-sm font-semibold transition"
            >
              <Play className="h-4 w-4 text-indigo-400 fill-indigo-400" />
              Watch Demo Pitch
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-16">
            {stats.map((stat, i) => (
              <div key={i} className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY HIGHLIGHT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-white">Targeted AI Specialties</h2>
          <p className="text-xs text-slate-400">Discover handpicked tools separated cleanly into specialized functional nodes.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => setActiveTab('tools')}
              className="group cursor-pointer rounded-xl border border-slate-900 bg-slate-950 p-4 text-center transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/40"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-850 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/5 transition">
                {getCategoryIcon(cat.icon)}
              </div>
              <h4 className="mt-3 text-xs font-bold text-slate-200 group-hover:text-white transition">{cat.name}</h4>
              <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">View Models</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED TOOLS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">Trending Node Models</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">Featured Marketplace Products</h2>
          </div>
          <button 
            onClick={() => setActiveTab('tools')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-4 sm:mt-0"
          >
            See all verified models
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedTools.slice(0, 3).map((tool) => (
            <div 
              key={tool.id}
              className="group relative flex flex-col rounded-2xl border border-slate-900 bg-slate-950 p-4 transition-all duration-300 hover:border-slate-800"
            >
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-900">
                <img 
                  src={tool.image} 
                  alt={tool.title} 
                  className="h-full w-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute left-3 top-3 rounded-md bg-indigo-600 px-2 py-0.5 text-[9px] uppercase font-black text-white">
                  {tool.type}
                </div>
              </div>

              <div className="flex-1 mt-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">{tool.title}</h3>
                  <span className="text-xs font-black text-indigo-400 font-mono">{tool.type === 'free' ? 'Free' : `$${tool.price}`}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">{tool.description}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-300">{tool.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-bold text-slate-300">{tool.users}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedToolSlug(tool.slug)}
                    className="rounded-lg border border-slate-800 hover:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition text-center"
                  >
                    View Specs
                  </button>
                  <button 
                    onClick={() => onQuickUse(tool)}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition text-center"
                  >
                    Execute Tool
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CREATOR TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-20" id="testimonials">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Platform Feedback</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">What our AI Creators & Users say</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              From individual content writing freelancers to enterprise engineering hubs, PRO DIGITAL™ streamlines how models are monetized and consumed.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "ProDigital Art Studio allowed us to quickly render 1,200 product graphics for our landing page campaign. The response time on the backend under latent node diffusion is incredible."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80" className="h-8 w-8 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Elena Rostova</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Product Marketing VP</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4">
              <div className="flex gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "As an AI developer, listing my model on PRO DIGITAL™ provided immediate traffic. The Stripe-aligned order settlement and transaction wallet makes distribution seamless."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80" className="h-8 w-8 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Marcus Vance</h4>
                  <p className="text-[10px] text-slate-500 font-mono">LLM Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUBSCRIPTION PRICING CARD */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-20" id="pricing">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 font-mono">Pricing Node Map</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Flexible Credit plans built for everyone</h2>
          <p className="text-xs text-slate-400">Save up to 20% on yearly plans. All tiers credit your wallet monthly with tokens.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</h3>
              <p className="mt-4 text-3xl font-black text-white">$0 <span className="text-xs font-normal text-slate-500">/ forever</span></p>
              <p className="mt-2 text-xs text-slate-500">Great for exploring the sandbox and basic model tests.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 500 initial signup credits</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Access to <strong>ProDigital Chat Free</strong></li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Basic text operations</li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveTab('login')}
              className="mt-8 w-full rounded-xl border border-slate-800 hover:bg-slate-900 py-2.5 text-xs font-bold text-slate-300 transition"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="rounded-2xl border-2 border-indigo-500 bg-slate-950 p-6 flex flex-col justify-between relative shadow-lg shadow-indigo-500/[0.03]">
            <div className="absolute right-4 top-4 rounded-md bg-indigo-500 px-2 py-0.5 text-[8px] uppercase font-black text-white">Popular</div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-sans">Pro Digital</h3>
              <p className="mt-4 text-3xl font-black text-white">$29 <span className="text-xs font-normal text-slate-500">/ month</span></p>
              <p className="mt-2 text-xs text-slate-400">Optimized for high-yield content marketing & designers.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> <strong>10,000 credits</strong> loaded monthly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> Unlocks all Pro level AI models</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> API access keys enabled</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400" /> 3x faster generation queues</li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveTab('login')}
              className="mt-8 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-black text-white transition shadow-lg shadow-indigo-600/25"
            >
              Subscribe to Pro Digital
            </button>
          </div>

          {/* Business Tier */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Enterprise</h3>
              <p className="mt-4 text-3xl font-black text-white">$99 <span className="text-xs font-normal text-slate-500">/ month</span></p>
              <p className="mt-2 text-xs text-slate-500">Engineered for scaling automation nodes & large teams.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-300 border-t border-slate-900 pt-6">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400" /> <strong>40,000 credits</strong> loaded monthly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400" /> Unlocks all Business & video nodes</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400" /> High-concurrency parallel API execution</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-purple-400" /> dedicated discord/email manager</li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveTab('login')}
              className="mt-8 w-full rounded-xl border border-slate-800 hover:bg-slate-900 py-2.5 text-xs font-bold text-slate-300 transition"
            >
              Choose Enterprise
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 border-t border-slate-900 pt-20" id="faq">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Find swift clarity on API keys, credits, and model details.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="rounded-xl border border-slate-900 bg-slate-950 overflow-hidden transition"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-slate-900/50 transition"
              >
                <span className="text-xs font-extrabold text-slate-200">{faq.q}</span>
                <span className="text-slate-500 text-sm font-bold">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs text-slate-400 border-t border-slate-900/50 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
