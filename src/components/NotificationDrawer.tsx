import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, TrendingDown, CheckCircle, Sparkles, AlertCircle, Trash2 } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    markNotifAsRead,
    clearNotifications,
    setActiveTab
  } = useApp();

  if (!notificationDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={() => setNotificationDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Bell className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-white">Price Alerts & Updates</h2>
            </div>
            
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
                  title="Clear all alerts"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setNotificationDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">No new notifications</p>
                <p className="text-xs text-slate-500 mt-1">
                  Track flights or set target prices to receive real-time price drop alerts.
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const getIcon = () => {
                  switch (notif.type) {
                    case 'PRICE_DROP':
                      return <TrendingDown className="h-4 w-4 text-emerald-400" />;
                    case 'TARGET_MET':
                      return <CheckCircle className="h-4 w-4 text-sky-400" />;
                    case 'PREDICTION_UPDATE':
                      return <Sparkles className="h-4 w-4 text-amber-400" />;
                    default:
                      return <AlertCircle className="h-4 w-4 text-slate-400" />;
                  }
                };

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) markNotifAsRead(notif.id);
                      if (notif.linkTab) {
                        setActiveTab(notif.linkTab as any);
                        setNotificationDrawerOpen(false);
                      }
                    }}
                    className={`p-3.5 rounded-lg border cursor-pointer transition ${
                      notif.read
                        ? 'border-slate-800/80 bg-slate-900/60 opacity-70 hover:opacity-100'
                        : 'border-slate-700 bg-slate-800/80 shadow-sm hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{getIcon()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-white truncate">{notif.title}</h3>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                        
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                          <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {notif.savingsInr && (
                            <span className="text-emerald-400 font-semibold">
                              Saved ₹{notif.savingsInr.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-400 bg-slate-950/40">
            FPPS Autonomous Fare Monitoring · Updated every 6 hours
          </div>

        </div>
      </div>
    </div>
  );
};
