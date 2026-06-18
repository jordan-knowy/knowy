import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  ChevronDown,
  Users,
  Building2,
  Zap
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';
import OnboardingCard from './knowr/OnboardingCard';

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ isOpen = true, onNavigate }: SidebarProps) {
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

  const mainItems = [
    { id: 'dashboard', label: 'Home',      icon: LayoutDashboard, path: '/dashboard' },
    { id: 'meetings',  label: 'Réunions',  icon: Calendar,        path: '/meetings'  },
    { id: 'companies', label: 'Comptes',   icon: Building2,       path: '/companies' },
    { id: 'contacts',  label: 'Personnes', icon: Users,           path: '/contacts'  },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/account' },
  ];

  const isActive = (path: string) => {
    if (path === '/contacts') {
      return location.pathname === '/contacts'
        || location.pathname.startsWith('/contact/')
        || location.pathname === '/relations'
        || location.pathname.startsWith('/relation/');
    }
    if (path === '/companies') {
      return location.pathname === '/companies' || location.pathname.startsWith('/company/');
    }
    if (path === '/meetings') {
      return location.pathname === '/meetings' || location.pathname.startsWith('/meeting/');
    }
    return location.pathname === path;
  };

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col z-20 md:fixed md:left-0 md:top-0"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex flex-col gap-0.5">
          <h1 style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--t1, #1A1040)', lineHeight: 1 }}>
            Know<span style={{ color: 'var(--violet, #6E50C8)' }}>r</span>
          </h1>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.10em', color: 'var(--t3, #9082B8)' }}>
            OS Relationnel
          </p>
        </div>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {mainItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => go(item.path)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
              }`}
              style={{ padding: '8px 12px' }}
            >
              <item.icon className="size-4 flex-shrink-0" />
              <span className="flex-1 text-left font-semibold" style={{ fontSize: '12.5px' }}>{item.label}</span>
            </motion.button>
          ))}

          {/* Coach — V2, désactivé */}
          <div className="w-full flex items-center gap-2.5 rounded-lg opacity-35 cursor-not-allowed select-none" style={{ padding: '8px 12px' }}>
            <Zap className="size-4 text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-left font-semibold text-muted-foreground" style={{ fontSize: '12.5px' }}>Coach</span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              V2
            </span>
          </div>
        </nav>

        {/* Prise en main — onboarding 5 gestes clés (réf. maquette) */}
        <OnboardingCard
          onGo={go}
          sourcesConnected={connectors.google || connectors.linkedin || connectors.hubspot}
        />

        <div className="mt-6 pt-6 border-t border-sidebar-border">
          <nav className="space-y-1">
            {bottomItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => go(item.path)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
                }`}
                style={{ padding: '8px 12px' }}
              >
                <item.icon className="size-4 flex-shrink-0" />
                <span className="flex-1 text-left font-semibold" style={{ fontSize: '12.5px' }}>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>

      {/* User account section */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.button
          onClick={() => go('/account')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-all"
        >
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName} className="size-9 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
          ) : (
            <div className="size-9 bg-gradient-to-br from-primary to-[#8B6FD4] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white shadow-sm" style={{ fontSize: '12px' }}>
              {profile?.initials ?? '?'}
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <p className="font-bold truncate" style={{ fontSize: '12.5px' }}>{profile?.fullName ?? 'Mon compte'}</p>
            <p className="truncate" style={{ fontSize: '10.5px', color: 'var(--t3, #9082B8)' }}>{profile?.companyName ?? ''}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />
        </motion.button>

        {/* Connector dots — live from Supabase */}
        <div className="mt-2 px-3 flex items-center gap-2">
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3, #9082B8)' }}>Sources</span>
          <div className="flex items-center gap-1.5">
            <div title={`Gmail ${connectors.google ? '✓' : '— non connecté'}`}
              className="size-2 rounded-full"
              style={{ background: connectors.google ? 'var(--sage, #2EA86A)' : 'var(--t4, #C4B8E0)' }} />
            <div title={`LinkedIn ${connectors.linkedin ? '✓' : '— non connecté'}`}
              className="size-2 rounded-full"
              style={{ background: connectors.linkedin ? 'var(--sage, #2EA86A)' : 'var(--t4, #C4B8E0)' }} />
            <div title={`HubSpot ${connectors.hubspot ? '✓' : '— non connecté'}`}
              className="size-2 rounded-full"
              style={{ background: connectors.hubspot ? 'var(--sage, #2EA86A)' : 'var(--t4, #C4B8E0)' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
