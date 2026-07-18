import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, FileText, Send, Image as ImageIcon, Video, Mic, 
  Copy, Download, Play, RefreshCw, SendHorizontal, Trash2, 
  Sliders, Volume2, User as UserIcon, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';
import { AITool, User } from '../types';

interface WorkspaceProps {
  activeTool: AITool | null;
  tools: AITool[];
  user: User | null;
  token: string | null;
  onRefreshUser: () => void;
  setActiveTab: (tab: any) => void;
  setActiveTool: (tool: AITool | null) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Workspace({
  activeTool,
  tools,
  user,
  token,
  onRefreshUser,
  setActiveTab,
  setActiveTool
}: WorkspaceProps) {
  // If no active tool is selected, default to the first approved tool or let user pick.
  const approvedTools = tools.filter(t => t.status === 'approved');
  const currentTool = activeTool || approvedTools[0];

  useEffect(() => {
    if (!activeTool && approvedTools.length > 0) {
      setActiveTool(approvedTools[0]);
    }
  }, [activeTool, approvedTools, setActiveTool]);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. AI Writer States
  const [writerPrompt, setWriterPrompt] = useState('');
  const [writerOutput, setWriterOutput] = useState('');

  // 2. AI Chatbot States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; timestamp: string }[]>([
    { sender: 'ai', text: 'Hello! I am ProDigital Chat Ultra, your specialized conversational co-pilot. How can I assist you today?', timestamp: new Date().toLocaleTimeString() }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 3. AI Image States
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageStyle, setImageStyle] = useState('Photorealistic');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [isRealImage, setIsRealImage] = useState(false);

  // 4. AI Video States
  const [videoScript, setVideoScript] = useState('');
  const [videoTheme, setVideoTheme] = useState('Cinematic');
  const [videoVoice, setVideoVoice] = useState('Male (Deep)');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoRendering, setVideoRendering] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [videoLogs, setVideoLogs] = useState<string[]>([]);

  // 5. AI Speech TTS States
  const [speechText, setSpeechText] = useState('');
  const [speechVoice, setSpeechVoice] = useState('Zephyr');
  const [speechSpeed, setSpeechSpeed] = useState(1);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Scroll chatbot to bottom when message arrives
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!currentTool) {
    return (
      <div className="text-center py-24 space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Retrieving available AI workspace nodes...</p>
      </div>
    );
  }

  // Check which workspace mode applies to this tool
  const getToolType = () => {
    const cat = currentTool.category.toLowerCase();
    if (cat.includes('chat')) return 'chat';
    if (cat.includes('writing') || cat.includes('writer')) return 'writer';
    if (cat.includes('image') || cat.includes('art')) return 'image';
    if (cat.includes('video') || cat.includes('clip')) return 'video';
    if (cat.includes('voice') || cat.includes('speech')) return 'voice';
    return 'chat'; // default to chat
  };

  const toolType = getToolType();

  // ==========================================
  // API EXECUTIONS
  // ==========================================

  // 1. Execute AI Writer
  const handleExecuteWriter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!writerPrompt.trim()) return;

    setLoading(true);
    setError('');
    setWriterOutput('');

    try {
      const res = await fetch('/api/ai/writer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: writerPrompt,
          toolId: currentTool.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWriterOutput(data.result);
        onRefreshUser(); // update credit wallet balance
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to process copywriting task.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Execute AI Chatbot
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString() }]);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          toolId: currentTool.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.result, timestamp: new Date().toLocaleTimeString() }]);
        onRefreshUser();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to generate chat reply.');
        setChatMessages(prev => [...prev, { sender: 'ai', text: `[Error: ${errData.error || 'Incomplete execution'}]`, timestamp: new Date().toLocaleTimeString() }]);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Execute AI Image
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!imagePrompt.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedImageUrl('');

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `${imagePromptStylePrefix()} ${imagePrompt}`,
          aspectRatio,
          toolId: currentTool.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImageUrl(data.imageUrl);
        setImageHistory(prev => [data.imageUrl, ...prev]);
        setIsRealImage(data.isRealGen);
        onRefreshUser();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to generate image.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const imagePromptStylePrefix = () => {
    switch (imageStyle) {
      case 'Watercolor': return 'A soft watercolor painting of';
      case 'Cyberpunk': return 'A neon-lit futuristic cyberpunk design of';
      case '3D Render': return 'An ultra-sharp crisp 3D octane render of';
      default: return 'A photorealistic ultra-detailed DSLR capture of';
    }
  };

  // 4. Execute AI Video Rendering (simulated compile stream logs)
  const handleRenderVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!videoScript.trim()) return;

    setVideoRendering(true);
    setVideoProgress(0);
    setVideoLogs([]);
    setGeneratedVideoUrl('');
    setError('');

    const logMessages = [
      'Initializing Video Render nodes...',
      'Decomposing script and compiling screenplay visual blocks...',
      'Mapping neural voiceover track models...',
      'Synthesizing cinematic transition coordinates...',
      'Assembling timeline stocks and rendering active frames...',
      'Merging MP4 containers and pushing preview streams...'
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      setVideoProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeVideoGeneration();
          return 100;
        }
        
        // Push logs periodically
        if (prev % 15 === 0 && logIndex < logMessages.length) {
          setVideoLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] ${logMessages[logIndex]}`]);
          logIndex++;
        }

        return prev + 5;
      });
    }, 200);
  };

  const completeVideoGeneration = async () => {
    try {
      const res = await fetch('/api/ai/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          script: videoScript,
          toolId: currentTool.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedVideoUrl(data.videoUrl);
        setVideoLogs(logs => [...logs, `[${new Date().toLocaleTimeString()}] Video compiled successfully! Load play.`]);
        onRefreshUser();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed rendering video file.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error rendering video.');
    } finally {
      setVideoRendering(false);
    }
  };

  // 5. Execute AI Speech synthetic TTS
  const handleSynthesizeSpeech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!speechText.trim()) return;

    setLoading(true);
    setError('');
    setGeneratedAudioBase64('');

    try {
      const res = await fetch('/api/ai/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: speechText,
          voiceName: speechVoice,
          toolId: currentTool.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedAudioBase64(data.audioBase64);
        onRefreshUser();
        
        if (data.audioBase64) {
          playAudioFromBase64(data.audioBase64);
        } else {
          // Local SpeechSynthesis browser fallback as requested
          executeBrowserSpeechFallback();
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to synthesize speech audio.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error synthesizing speech.');
    } finally {
      setLoading(false);
    }
  };

  const playAudioFromBase64 = (base64: string) => {
    try {
      setIsAudioPlaying(true);
      const audioUrl = `data:audio/mp3;base64,${base64}`;
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setIsAudioPlaying(false);
    } catch (err) {
      console.error('Audio playback crashed:', err);
    }
  };

  const executeBrowserSpeechFallback = () => {
    if ('speechSynthesis' in window) {
      setIsAudioPlaying(true);
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = speechSpeed;
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => setIsAudioPlaying(false);
    } else {
      alert('Your browser does not support Speech Synthesis APIs.');
    }
  };

  // Helpers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied output successfully to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16">
      
      {/* LEFT COLUMN: Tool Switcher Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-4">
          <div className="border-b border-slate-900 pb-3">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Models Directory</h3>
            <p className="text-[10px] text-slate-500 mt-1">Select an active tool node to mount.</p>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {approvedTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool); setError(''); }}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition ${
                  currentTool.id === tool.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-slate-900'
                }`}
              >
                <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                  <img src={tool.image} alt={tool.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{tool.title}</h4>
                  <p className={`text-[9px] uppercase font-mono ${currentTool.id === tool.id ? 'text-indigo-200' : 'text-slate-500'}`}>{tool.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Active Tool Specs */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold text-indigo-400">active node</span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">SPEC_MAP</span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-slate-200">{currentTool.title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">{currentTool.description}</p>
          </div>

          <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>CONSUMPTION RATE:</span>
            <span className="font-bold text-indigo-400">
              {toolType === 'writer' ? '50 CREDITS / RUN' : 
               toolType === 'chat' ? '10 CREDITS / MSG' : 
               toolType === 'image' ? '150 CREDITS / IMG' : 
               toolType === 'video' ? '300 CREDITS / CLIP' : 
               '100 CREDITS / SYNTH'}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Sandbox Workspace Canvas */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Error logger bar */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400 animate-slide-down">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <p>{error}</p>
            {error.includes('credits') && (
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="ml-auto text-[10px] uppercase font-black bg-rose-500/10 hover:bg-rose-500 hover:text-white px-2.5 py-1 rounded transition"
              >
                Top up wallet
              </button>
            )}
          </div>
        )}

        {/* THE MAIN WORKSPACE SWITCHER */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-6 sm:p-8">
          
          {/* A. WORKSPACE: AI WRITER */}
          {toolType === 'writer' && (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-black text-slate-100">AI Copywriting Suite</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Node ID: writer-pro</span>
              </div>

              <form onSubmit={handleExecuteWriter} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provide Text Instructions or Prompts</label>
                  <textarea
                    value={writerPrompt}
                    onChange={(e) => setWriterPrompt(e.target.value)}
                    placeholder="Write a highly-persuasive email landing copy for a premium SaaS developer productivity tool, targeting tech founders..."
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono">
                    <span>MAX LENGTH: 1000 CHARS</span>
                    <span>{writerPrompt.length}/1000 CHARS</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !writerPrompt.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold px-6 py-3 text-xs transition shadow-lg shadow-indigo-600/20"
                  >
                    {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                    Generate Premium Copy (50 Credits)
                  </button>
                </div>
              </form>

              {/* Writer Output Card */}
              {writerOutput && (
                <div className="mt-8 rounded-xl border border-slate-900 bg-slate-900/20 p-5 space-y-4 animate-slide-up">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated Copy Output</span>
                    <button 
                      onClick={() => copyToClipboard(writerOutput)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Content
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans prose prose-invert">
                    {writerOutput}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. WORKSPACE: AI CHATBOT */}
          {toolType === 'chat' && (
            <div className="space-y-6 flex flex-col h-[550px]">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-black text-slate-100">Live ProDigital Chat Conversationalist</h2>
                    <p className="text-[10px] text-emerald-400 mt-0.5 font-mono flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Gemini reasoning node online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([{ sender: 'ai', text: 'Hello! Chat history has been cleared. How can I assist you?', timestamp: new Date().toLocaleTimeString() }])}
                  className="text-slate-500 hover:text-white transition"
                  title="Clear chat history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 text-xs ${
                      msg.sender === 'user' ? 'bg-indigo-600/15 border-indigo-500/25 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}>
                      {msg.sender === 'user' ? <UserIcon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin-slow" />}
                    </div>
                    
                    <div className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-900/60 text-slate-300 rounded-tl-none border border-slate-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="block text-[8px] font-mono text-slate-500 mt-2 text-right">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                    </div>
                    <div className="rounded-2xl rounded-tl-none p-3.5 text-xs bg-slate-900/60 text-slate-500 border border-slate-900 italic flex items-center gap-2">
                      <span>ProDigital Chat is formulating response...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-slate-900 pt-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask any research prompt, codebase explanation, or copywriting drafting query..."
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-850 bg-slate-900/30 px-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading || !chatInput.trim()}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-3.5 transition"
                >
                  <SendHorizontal className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          )}

          {/* C. WORKSPACE: AI IMAGE GENERATOR */}
          {toolType === 'image' && (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  <h2 className="text-sm font-black text-slate-100">Diffusion Latent Art Canvas</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Node ID: diffusion-studio</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Image Parameters sidebar */}
                <form onSubmit={handleGenerateImage} className="md:col-span-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visual Prompt</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="An astronaut riding a glowing neon horse on the surface of mars, hyperrealistic concept art, DSLR..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                    />
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['1:1', '16:9', '9:16', '3:4'].map(ratio => (
                        <button
                          type="button"
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`rounded-lg border py-1.5 text-center text-[10px] font-bold transition ${
                            aspectRatio === ratio 
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400' 
                              : 'border-slate-850 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Artistic Style Theme</label>
                    <select
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Photorealistic">DSLR Photorealistic</option>
                      <option value="Cyberpunk">Cyberpunk Neon Glow</option>
                      <option value="3D Render">3D Octane Render</option>
                      <option value="Watercolor">Soft Watercolor Accent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !imagePrompt.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-extrabold py-3 text-xs transition shadow-lg shadow-purple-600/20"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Synthesize Image (150 Credits)
                  </button>
                </form>

                {/* Interactive image canvas render area */}
                <div className="md:col-span-2 flex flex-col justify-center items-center border border-slate-900 bg-slate-900/10 rounded-2xl p-6 min-h-[300px]">
                  {loading ? (
                    <div className="text-center space-y-4">
                      <RefreshCw className="h-10 w-10 text-purple-500 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Rendering visual lattice nodes...</p>
                        <p className="text-[10px] text-slate-500 font-mono">DEDUTING 150 CREDITS ON SUCCESSFUL COMPILE</p>
                      </div>
                    </div>
                  ) : generatedImageUrl ? (
                    <div className="space-y-4 w-full">
                      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 mx-auto max-w-sm">
                        <img src={generatedImageUrl} alt="Generated visual outcome" className="w-full object-contain max-h-80" />
                        
                        {/* Status notification */}
                        <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-950/95 backdrop-blur border border-slate-850 p-2.5 flex justify-between items-center">
                          <div>
                            <span className="block text-[8px] font-mono text-slate-500 uppercase">SYNTHESIS NODE</span>
                            <span className="text-[10px] font-bold text-emerald-400">{isRealImage ? 'Gemini Generative API' : 'Curated Sandbox Blend'}</span>
                          </div>
                          
                          <a 
                            href={generatedImageUrl} 
                            download={`prodigital_art_image_${generateId()}.jpg`}
                            className="rounded bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 transition"
                            title="Download PNG File"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto border border-slate-850">
                        <ImageIcon className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Canvas Ready</p>
                        <p className="text-[10px] text-slate-600 max-w-xs leading-normal mt-1">Provide a creative visual prompt and select your aspect ratio parameters to compile graphics.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generations History */}
              {imageHistory.length > 0 && (
                <div className="border-t border-slate-900 pt-6 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Canvas Generations History</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {imageHistory.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setGeneratedImageUrl(img)}
                        className="h-16 w-16 rounded-lg overflow-hidden border border-slate-850 cursor-pointer shrink-0 hover:border-purple-500 transition"
                      >
                        <img src={img} alt="History image" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* D. WORKSPACE: AI VIDEO GENERATOR */}
          {toolType === 'video' && (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-teal-400" />
                  <h2 className="text-sm font-black text-slate-100">Cinematic Script-To-Video Editor</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Node ID: script-rendered-mp4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Script Panel */}
                <form onSubmit={handleRenderVideo} className="md:col-span-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Video Script / Screenplay</label>
                    <textarea
                      value={videoScript}
                      onChange={(e) => setVideoScript(e.target.value)}
                      placeholder="FADE IN: A drone sweep of a dark, rain-slicked cyberpunk street. A street vendor stirs steam under neon signs. Voiceover explains the rise of automated intelligence..."
                      rows={5}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition leading-relaxed font-mono"
                    />
                  </div>

                  {/* Theme Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visual Theme</label>
                    <select
                      value={videoTheme}
                      onChange={(e) => setVideoTheme(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    >
                      <option value="Cinematic">Cinematic 4K Dramatic</option>
                      <option value="Corporate">Corporate Explainer Slides</option>
                      <option value="Abstract">Surreal Dreamscape Loop</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={videoRendering || !videoScript.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-extrabold py-3 text-xs transition shadow-lg shadow-teal-600/20"
                  >
                    {videoRendering ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    Render MP4 Package (300 Credits)
                  </button>
                </form>

                {/* Video Compilation Screen */}
                <div className="md:col-span-2 border border-slate-900 bg-slate-900/10 rounded-2xl p-6 min-h-[350px] flex flex-col justify-between">
                  {videoRendering ? (
                    <div className="space-y-6 w-full my-auto">
                      <div className="text-center space-y-2">
                        <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mx-auto" />
                        <h4 className="text-xs font-bold text-slate-100">Compiling Video Timeline Frames</h4>
                        <span className="text-[9px] font-mono text-slate-500">{videoProgress}% COMPLETION</span>
                      </div>
                      
                      {/* Progress bar meter */}
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                      </div>

                      {/* Compilation logs list */}
                      <div className="rounded-xl border border-slate-900 bg-slate-950 p-3 max-h-32 overflow-y-auto space-y-1 text-[9px] font-mono text-slate-500">
                        {videoLogs.map((log, idx) => (
                          <p key={idx}>{log}</p>
                        ))}
                      </div>
                    </div>
                  ) : generatedVideoUrl ? (
                    <div className="space-y-4 w-full">
                      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
                        <video 
                          src={generatedVideoUrl} 
                          controls 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="block text-[8px] font-mono text-slate-500 uppercase">OUTPUT RESOLUTION</span>
                          <span className="text-[10px] font-bold text-slate-200">Full High-Definition (1080p, 60fps)</span>
                        </div>
                        <a 
                          href={generatedVideoUrl} 
                          download={`prodigital_video_render_${generateId()}.mp4`}
                          className="flex items-center gap-1 rounded bg-teal-600 hover:bg-teal-500 px-3.5 py-1.5 text-[10px] font-extrabold text-white transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download MP4
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 my-auto">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto border border-slate-850">
                        <Video className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Rendering Console Active</p>
                        <p className="text-[10px] text-slate-600 max-w-xs leading-normal mt-1 mx-auto">Paste a comprehensive cinematic screenplay script outline. Pick sound and theme filters to synthesize professional video templates.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* E. WORKSPACE: AI VOICE SYNTH / TTS */}
          {toolType === 'voice' && (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-amber-400" />
                  <h2 className="text-sm font-black text-slate-100">Neural Synthetic TTS Speech Synthesizer</h2>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Node ID: gemini-speech-vox</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TTS Form panel */}
                <form onSubmit={handleSynthesizeSpeech} className="md:col-span-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input Transcript</label>
                    <textarea
                      value={speechText}
                      onChange={(e) => setSpeechText(e.target.value)}
                      placeholder="Welcome to the PRO DIGITAL™ dashboard. Your synthetic speech models are fully generated server-side using multi-emotive TTS parameters..."
                      rows={5}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition leading-relaxed"
                    />
                  </div>

                  {/* Voice Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Speaker Voice Accent</label>
                    <select
                      value={speechVoice}
                      onChange={(e) => setSpeechVoice(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Zephyr">Zephyr (Male, Warm, Energetic)</option>
                      <option value="Kore">Kore (Female, Conversational, Clear)</option>
                      <option value="Zeus">Zeus (Male, Deep, Majestic)</option>
                      <option value="Hera">Hera (Female, Editorial, Professional)</option>
                    </select>
                  </div>

                  {/* Speed parameter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Speaking Speed Rate</span>
                      <span>{speechSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechSpeed}
                      onChange={(e) => setSpeechSpeed(Number(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer focus:outline-none accent-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !speechText.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold py-3 text-xs transition shadow-lg shadow-amber-600/20"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4 animate-bounce" />}
                    Synthesize Speech (100 Credits)
                  </button>
                </form>

                {/* Audio Output Player console */}
                <div className="md:col-span-2 border border-slate-900 bg-slate-900/10 rounded-2xl p-6 min-h-[250px] flex flex-col justify-center items-center">
                  {loading ? (
                    <div className="text-center space-y-4">
                      <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">Compiling lossy synth speech container...</p>
                        <p className="text-[10px] text-slate-500 font-mono">DEDUCTING 100 TOKENS</p>
                      </div>
                    </div>
                  ) : generatedAudioBase64 || isAudioPlaying ? (
                    <div className="text-center space-y-5">
                      <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
                        <Volume2 className="h-8 w-8 text-amber-500" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">Neural Speech Stream Synthesized</h4>
                        <p className="text-[10px] text-emerald-400 font-mono">Status: Stream Active (accents matching speaker: {speechVoice})</p>
                      </div>

                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            if (generatedAudioBase64) playAudioFromBase64(generatedAudioBase64);
                            else executeBrowserSpeechFallback();
                          }}
                          className="flex items-center gap-1 rounded bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white transition"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Replay Stream
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center mx-auto border border-slate-850">
                        <Volume2 className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Speech Console Ready</p>
                        <p className="text-[10px] text-slate-600 max-w-xs leading-normal mt-1">Provide a text transcription narrative. Select accents and adjust pitch parameters to compile natural human voices.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
