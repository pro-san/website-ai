import React from 'react';
import { Sparkles, Globe, Shield, HelpCircle, ArrowRight } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: any) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight">PRO DIGITAL™</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unlock the power of artificial intelligence. Access thousands of custom AI tools optimized for digital creativity, automated writing, voice synthesis, and SaaS business growth.
            </p>
            <div className="flex items-center gap-3 text-slate-500">
              <Globe className="h-4 w-4 hover:text-white cursor-pointer transition" />
              <Shield className="h-4 w-4 hover:text-white cursor-pointer transition" />
              <HelpCircle className="h-4 w-4 hover:text-white cursor-pointer transition" />
            </div>
          </div>

          {/* Tools Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Core Specialties</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">AI Chatbots</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Copywriting & Blogging</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Generative Diffusion Art</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Marketing & SEO Automation</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Voice Synthetic Speech</button></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition">Explore Marketplace</button></li>
              <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition">Developer API Keys</button></li>
              <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-white transition">Credit Wallet</button></li>
              <li><a href="#testimonials" className="hover:text-white transition">Creator Testimonials</a></li>
              <li><a href="#faq" className="hover:text-white transition">Frequently Asked FAQ</a></li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">Subscribe to News</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Get notified weekly of newly approved models, promotional price cuts, and bonus credit giveaways.</p>
            <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent px-2.5 py-1 text-xs text-white focus:outline-none placeholder-slate-600"
              />
              <button 
                onClick={() => alert('Subscription registered successfully! Welcome to the newsletter.')}
                className="rounded-md bg-indigo-600 p-1.5 hover:bg-indigo-500 text-white transition"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row justify-between items-center text-slate-600 text-[10px]">
          <p>© 2026 PRO DIGITAL™ AI Marketplace. All global rights reserved. Engineered for scale.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Sitemap Index</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
