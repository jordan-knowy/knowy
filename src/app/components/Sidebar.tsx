import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  CreditCard,
  ChevronDown,
  Network,
  Zap,
  X,
  LogOut
} from 'lucide-react';
import { Button } from './design-system';
import { supabase } from '../../lib/supabase';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useCurrentProfile();

  const dashboardItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
  ];

  const journeyItems = [
    { id: 'meetings', label: 'Réunions', icon: Calendar, path: '/meetings' },
    { id: 'coaching', label: 'Coaching', icon: Zap, path: '/coaching' },
    { id: 'relations', label: 'Relations', icon: Network, path: '/relations' }
  ];

  const bottomItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/account' },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard, path: '/subscription' }
  ];

  const isActive = (path: string) => {
    if (path === '/relations') {
      return location.pathname === '/relations' || location.pathname.startsWith('/relation/');
    }
    if (path === '/meetings') {
      return location.pathname === '/meetings' || location.pathname.startsWith('/meeting/');
    }
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    onClose?.();
    navigate('/signin', { replace: true });
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-20 bg-violet-night/30 lg:hidden"
          onClick={onClose}
        />
      )}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed left-0 top-0 z-30 h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar ${isOpen === false ? 'hidden lg:flex' : 'flex'}`}
      >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black italic text-foreground">
            Know<span className="text-primary">y</span>
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Relational Intelligence
          </p>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Fermer la navigation" icon={<X className="size-4" />} onClick={onClose} />
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {/* Dashboard */}
        <nav className="space-y-1">
          {dashboardItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                onClose?.();
              }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
              }`}
            >
              <item.icon className="size-5" />
              <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Journey items */}
        <div className="mt-6 pt-6 border-t border-sidebar-border">
          <nav className="space-y-1">
            {journeyItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
                }`}
              >
                <item.icon className="size-5" />
                <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-sidebar-border">
          <nav className="space-y-1">
            {bottomItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  onClose?.();
                }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
                }`}
              >
                <item.icon className="size-5" />
                <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>

      {/* User account section */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.button
          onClick={() => {
            navigate('/account');
            onClose?.();
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-lavender-100 transition-all"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-10 rounded-full border-2 border-white object-cover shadow-sm" />
          ) : (
            <div className="size-10 bg-gradient-to-br from-primary to-[#8B6FD4] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm">
              {profile?.initials ?? 'K'}
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.fullName ?? 'Compte Knowy'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.companyName ?? profile?.email ?? 'Workspace'}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />
        </motion.button>

        {/* Connectors status */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start"
          icon={<LogOut className="size-4" />}
          onClick={handleSignOut}
        >
          Déconnexion
        </Button>
      </div>
      </motion.div>
    </>
  );
}
