import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  CreditCard,
  ChevronDown,
  Network,
  Zap
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useCurrentProfile();
  const [connectors, setConnectors] = useState({ google: false, linkedin: false, hubspot: false });

  useEffect(() => {
    let mounted = true;
    async function loadConnectors() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('connectors')
        .select('provider, status')
        .eq('user_id', user.id);
      if (mounted && data) {
        const map: Record<string, boolean> = {};
        (data as any[]).forEach(c => { map[c.provider] = c.status === 'connected'; });
        setConnectors({ google: map['google'] ?? false, linkedin: map['linkedin'] ?? false, hubspot: map['hubspot'] ?? false });
      }
    }
    loadConnectors();
    return () => { mounted = false; };
  }, []);

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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-screen w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col z-20"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black italic text-foreground">
            Know<span className="text-primary">y</span>
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Relational Intelligence
          </p>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {/* Dashboard */}
        <nav className="space-y-1">
          {dashboardItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
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
                onClick={() => navigate(item.path)}
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
                onClick={() => navigate(item.path)}
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
          onClick={() => navigate('/account')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-all"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName} className="size-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
          ) : (
            <div className="size-10 bg-gradient-to-br from-primary to-[#8B6FD4] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm">
              {profile?.initials ?? '?'}
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.fullName ?? 'Mon compte'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.companyName ?? ''}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />
        </motion.button>

        {/* Connector dots — live from Supabase */}
        <div className="mt-3 px-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sources :</span>
          <div className="flex items-center gap-1.5">
            <div title={`Gmail ${connectors.google ? '✓' : '— non connecté'}`}
              className={`size-2 rounded-full ${connectors.google ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            <div title={`LinkedIn ${connectors.linkedin ? '✓' : '— non connecté'}`}
              className={`size-2 rounded-full ${connectors.linkedin ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            <div title={`HubSpot ${connectors.hubspot ? '✓' : '— non connecté'}`}
              className={`size-2 rounded-full ${connectors.hubspot ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
