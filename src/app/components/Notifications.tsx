import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  X,
  AlertCircle,
  Calendar,
  TrendingDown,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  Zap,
  Cake,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'urgent' | 'important' | 'info';
  title: string;
  description: string;
  time: string;
  link: string;
  read: boolean;
  icon: typeof AlertCircle;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Anniversaire de Sarah Chen',
      description: 'Compte en développement - Opportunité de renforcer la relation',
      time: 'Aujourd\'hui',
      link: '/relation/1',
      read: false,
      icon: Cake
    },
    {
      id: '2',
      type: 'important',
      title: 'Julie Martin a publié un nouveau poste',
      description: 'Devient VP Sales - Nouvelle équipe de 5 personnes - Potentiel upsell',
      time: 'Il y a 2h',
      link: '/relation/3',
      read: false,
      icon: TrendingUp
    },
    {
      id: '3',
      type: 'urgent',
      title: 'Thomas Lebrun va quitter son poste',
      description: 'Départ prévu dans 3 mois - Action requise pour maintenir la relation',
      time: 'Il y a 5h',
      link: '/relation/4',
      read: false,
      icon: Briefcase
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
    navigate(notification.link);
    setIsOpen(false);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const typeStyles = {
    urgent: {
      bg: 'bg-destructive/5 hover:bg-destructive/10',
      border: 'border-l-4 border-l-destructive',
      dot: 'bg-destructive',
      icon: 'text-destructive'
    },
    important: {
      bg: 'bg-warning/5 hover:bg-warning/10',
      border: 'border-l-4 border-l-warning',
      dot: 'bg-warning',
      icon: 'text-warning'
    },
    info: {
      bg: 'bg-primary/5 hover:bg-primary/10',
      border: 'border-l-4 border-l-primary',
      dot: 'bg-primary',
      icon: 'text-primary'
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted/50 rounded-xl transition-colors"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Notifications Panel */}
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
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout marquer lu
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

              {/* Notifications List */}
              <div className="max-h-[500px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification, i) => {
                      const Icon = notification.icon;
                      const styles = typeStyles[notification.type];

                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full p-4 text-left transition-colors ${styles.bg} ${styles.border} ${
                            !notification.read ? 'bg-opacity-100' : 'bg-opacity-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'urgent' ? 'bg-destructive/10' :
                              notification.type === 'important' ? 'bg-warning/10' :
                              'bg-primary/10'
                            }`}>
                              <Icon className={`size-5 ${styles.icon}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm">{notification.title}</p>
                                {!notification.read && (
                                  <span className={`size-2 rounded-full flex-shrink-0 mt-1.5 ${styles.dot}`} />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {notification.description}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {notification.time}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border bg-muted/30 text-center">
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsOpen(false);
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Voir toutes les alertes
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
