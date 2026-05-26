import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Bell,
  X,
  AlertCircle,
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  RefreshCw,
  Loader2,
  FileText,
  Users,
} from 'lucide-react';
import { useNotifications, type KnowyNotification } from '../../hooks/useNotifications';
import { useState } from 'react';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const typeIcon: Record<KnowyNotification['type'], React.ElementType> = {
  brief_ready: FileText,
  meeting_soon: Calendar,
  no_brief: AlertCircle,
  contact_alert: Users,
  deal_risk: AlertCircle,
  sync_done: RefreshCw,
  team_update: Users,
  system: Sparkles,
};

const priorityStyles = {
  urgent: {
    bg: 'hover:bg-destructive/5',
    border: 'border-l-4 border-l-destructive',
    dot: 'bg-destructive',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
  important: {
    bg: 'hover:bg-warning/5',
    border: 'border-l-4 border-l-warning',
    dot: 'bg-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  info: {
    bg: 'hover:bg-primary/5',
    border: 'border-l-4 border-l-primary',
    dot: 'bg-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, unreadCount, markRead, markAllRead, dismiss, reload } = useNotifications();

  async function handleClick(n: KnowyNotification) {
    await markRead(n.id);
    if (n.link) navigate(n.link);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      {/* Bell */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 hover:bg-muted/50 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-[420px] bg-card rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                <div>
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    {loading ? 'Chargement…' : unreadCount === 0 ? 'Tout est lu' : `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reload()}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="size-4 text-muted-foreground" />
                  </button>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline px-1">
                      Tout lire
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="size-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="size-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="font-medium mb-1">Tout est à jour</p>
                    <p className="text-xs text-muted-foreground">
                      Les notifications apparaissent automatiquement selon vos réunions et activités.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n) => {
                      const Icon = typeIcon[n.type] || Zap;
                      const styles = priorityStyles[n.priority];
                      const isUnread = !n.read_at;

                      return (
                        <div
                          key={n.id}
                          className={`relative group ${styles.bg} ${styles.border} transition-colors ${
                            isUnread ? '' : 'opacity-60'
                          }`}
                        >
                          <button
                            onClick={() => handleClick(n)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-start gap-3 pr-6">
                              <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                                <Icon className={`size-5 ${styles.iconColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-semibold text-sm leading-tight">{n.title}</p>
                                  {isUnread && (
                                    <span className={`size-2 rounded-full flex-shrink-0 mt-1.5 ${styles.dot}`} />
                                  )}
                                </div>
                                {n.body && (
                                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{n.body}</p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="size-3" />
                                  {relativeTime(n.created_at)}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Dismiss button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                            className="absolute top-3 right-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-md transition-all"
                            title="Ignorer"
                          >
                            <X className="size-3 text-muted-foreground" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={async () => {
                      await markAllRead();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Effacer toutes les lues
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
