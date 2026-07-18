import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';
import { Send, Users, Shield, MessageSquare, Loader2, Sparkles, Circle } from 'lucide-react';

interface LiveChatProps {
  currentUser: User;
  activeUsersList: { userId: string; name: string; role: string }[];
  chatMessages: ChatMessage[];
  onSendMessage: (recipientId: string, content: string) => void;
  onSendTyping: (recipientId: string, isTyping: boolean) => void;
  typingStatus: { [userId: string]: { name: string; isTyping: boolean } };
}

export default function LiveChat({
  currentUser,
  activeUsersList,
  chatMessages,
  onSendMessage,
  onSendTyping,
  typingStatus
}: LiveChatProps) {
  const [activeTab, setActiveTab] = useState<'global' | string>('global'); // 'global' or userId
  const [messageText, setMessageText] = useState('');
  const [typingTimer, setTypingTimer] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, typingStatus]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
      return;
    }

    // Trigger typing state
    onSendTyping(activeTab, true);
    
    if (typingTimer) clearTimeout(typingTimer);
    
    setTypingTimer(
      setTimeout(() => {
        onSendTyping(activeTab, false);
      }, 1500)
    );
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    
    onSendMessage(activeTab, messageText.trim());
    onSendTyping(activeTab, false);
    setMessageText('');
  };

  // Determine current room messages
  const displayedMessages = chatMessages.filter((msg) => {
    if (activeTab === 'global') {
      return msg.recipientId === 'global';
    } else {
      // Private message filter (either sender is me and recipient is tab, or sender is tab and recipient is me)
      return (
        (msg.senderId === currentUser.id && msg.recipientId === activeTab) ||
        (msg.senderId === activeTab && msg.recipientId === currentUser.id)
      );
    }
  });

  // Check if anyone is typing in the active room
  const activeTypist = Object.entries(typingStatus).find(([id, state]) => {
    if (activeTab === 'global') {
      return state.isTyping && id !== currentUser.id;
    } else {
      return state.isTyping && id === activeTab;
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-pink-400';
      case 'manager': return 'text-amber-400';
      case 'staff': return 'text-sky-400';
      default: return 'text-slate-400';
    }
  };

  const getActiveTabName = () => {
    if (activeTab === 'global') return 'Enterprise Group Hub';
    const peer = activeUsersList.find(u => u.userId === activeTab);
    return peer ? `Private Channel: ${peer.name}` : 'Unknown Channel';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden h-[500px] flex" id="chat-hub-container">
      {/* Sidebar - Channels / Online Users */}
      <div className="w-56 sm:w-64 border-r border-slate-800 flex flex-col bg-slate-950/20">
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <h4 className="font-bold text-xs uppercase font-mono text-slate-400 tracking-wider flex items-center gap-2">
            <Users size={14} className="text-indigo-400" />
            Communication Hub
          </h4>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {/* Global Room Button */}
          <button
            onClick={() => setActiveTab('global')}
            className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition ${
              activeTab === 'global'
                ? 'bg-indigo-600/10 border border-indigo-500/25 text-slate-100 font-bold'
                : 'border border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={15} className="text-indigo-400" />
              <span className="text-xs">Global Group Hub</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {/* Peer List Divider */}
          <div className="text-[10px] uppercase font-mono text-slate-500 py-2 pl-3 tracking-widest font-bold">
            Private Contacts
          </div>

          {/* Active Contacts */}
          {activeUsersList
            .filter((u) => u.userId !== currentUser.id)
            .map((user) => (
              <button
                key={user.userId}
                onClick={() => setActiveTab(user.userId)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition ${
                  activeTab === user.userId
                    ? 'bg-sky-600/10 border border-sky-500/25 text-slate-100 font-bold'
                    : 'border border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                      {user.name.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900"></span>
                  </div>
                  <div>
                    <h5 className="text-xs truncate max-w-[120px] font-semibold">{user.name}</h5>
                    <span className={`text-[9px] font-mono uppercase block ${getRoleColor(user.role)}`}>{user.role}</span>
                  </div>
                </div>
              </button>
            ))}

          {activeUsersList.filter((u) => u.userId !== currentUser.id).length === 0 && (
            <p className="text-[10px] text-slate-500 italic text-center py-6">No other peers online.</p>
          )}
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-slate-900/40">
        {/* Chat Feed Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/10">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-100 font-display">{getActiveTabName()}</h4>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse mr-1" />
            SECURE CHANNEL
          </div>
        </div>

        {/* Message scroll list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <MessageSquare size={36} className="text-slate-700 stroke-[1.5]" />
              <p className="text-xs italic">Clear channel. Send a secure transmission.</p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] space-y-1`}>
                    {/* Header line for peer messages */}
                    {!isMe && (
                      <div className="flex items-center gap-1.5 text-[10px] pl-1">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span className={`uppercase font-mono font-bold ${getRoleColor(msg.senderRole)}`}>
                          [{msg.senderRole}]
                        </span>
                      </div>
                    )}
                    
                    {/* Chat Bubble */}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-indigo-600 text-slate-50 rounded-tr-none shadow-md' 
                        : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Footer Time */}
                    <div className={`text-[9px] text-slate-500 font-mono px-1.5 ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <span className="ml-1 text-indigo-400">✓ Delivered</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing state */}
          {activeTypist && (
            <div className="flex justify-start">
              <div className="bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-full text-[10px] text-slate-400 flex items-center gap-2">
                <Loader2 size={10} className="animate-spin text-sky-400" />
                <span>{activeTypist[1].name} is typing...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a transmission to this channel..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              id="chat-input"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-50 p-2.5 rounded-xl flex items-center justify-center shadow-lg hover:shadow-indigo-500/15 transition"
              id="chat-send-btn"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
