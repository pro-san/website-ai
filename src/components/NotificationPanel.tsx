import React from 'react';
import { Bell, CheckCircle, Trash2, X, Archive, Sparkles } from 'lucide-react';
import { Notification } from '../types';

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotificationPanel({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead
}: NotificationPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop overlay */}
        <div 
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md border-l border-slate-900 bg-slate-950">
            <div className="flex h-full flex-col overflow-y-scroll py-6 shadow-2xl">
              {/* Header */}
              <div className="px-4 sm:px-6 border-b border-slate-900 pb-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-sm font-black text-slate-100" id="slide-over-title">Notifications Hub</h2>
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button 
                      onClick={onClose}
                      className="rounded-md text-slate-500 hover:text-white focus:outline-none transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {notifications.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {notifications.filter(n => n.readStatus === 'unread').length} unread alerts
                    </span>
                    <button 
                      onClick={onMarkAllRead}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="relative mt-6 flex-1 px-4 sm:px-6">
                {notifications.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-850">
                      <Archive className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">All cleared up!</p>
                      <p className="text-[10px] text-slate-600 mt-1">There are no unread system notifications right now.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`group relative flex flex-col rounded-xl border p-4 transition-all duration-200 ${
                          notif.readStatus === 'unread'
                            ? 'border-indigo-500/25 bg-indigo-500/[0.02] shadow-lg shadow-indigo-500/[0.01]'
                            : 'border-slate-900 bg-slate-950/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            <h4 className="text-xs font-bold text-slate-200">{notif.title}</h4>
                          </div>
                          
                          {notif.readStatus === 'unread' && (
                            <button 
                              onClick={() => onMarkRead(notif.id)}
                              className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white px-2 py-0.5 rounded transition"
                              title="Mark read"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                          {notif.message}
                        </p>

                        <span className="mt-3 text-[9px] font-mono text-slate-600">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
