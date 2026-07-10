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
  Link2,
  Shield
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';
import OnboardingCard from './knowr/OnboardingCard';
import BrandLogo from './knowr/BrandLogo';

interface SidebarProps {
  isOpen?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ isOpen = true, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useCurrentProfile();
  const [connectors, setConnectors] = useState({ google: false, linkedin: false, hubspot: false });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
      const { data: sa } = await supabase.from('super_admins').select('id').maybeSingle();
      if (mounted) setIsSuperAdmin(!!sa);
    }
    loadConnectors();
    return () => { mounted = false; };
  }, []);

  const mainItems = [
    { id: 'dashboard',   label: 'Home',        icon: LayoutDashboard, path: '/dashboard' },
    { id: 'meetings',    label: 'Réunions',    icon: Calendar,        path: '/meetings'  },
    { id: 'companies',   label: 'Comptes',     icon: Building2,       path: '/companies' },
    { id: 'contacts',    label: 'Personnes',   icon: Users,           path: '/contacts'  },
    { id: 'connectors',  label: 'Connecteurs', icon: Link2,           path: '/account?tab=connections' },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/account' },
    ...(isSuperAdmin ? [{ id: 'super-admin', label: 'Super Admin', icon: Shield, path: '/super-admin' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/contacts') {
      return location.pathname === '/contacts'
        || location.pathname.startsWith('/contact/');
    }
    if (path === '/companies') {
      return location.pathname === '/companies' || location.pathname.startsWith('/company/');
    }
    if (path === '/meetings') {
      return location.pathname === '/meetings' || location.pathname.startsWith('/meeting/');
    }
    if (path === '/account?tab=connections') {
      return location.pathname === '/account' && location.search.includes('tab=connections');
    }
    if (path === '/account') {
      return location.pathname === '/account' && !location.search.includes('tab=connections');
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
      className="h-screen w-[238px] bg-sidebar border-r border-sidebar-border flex flex-col z-20 md:fixed md:left-0 md:top-0"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <BrandLogo />
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {/* Bohu — mémoire relationnelle d'équipe, à venir (badge icône identique à la maquette) */}
          <div className="w-full flex items-center gap-[11px] rounded-lg cursor-not-allowed select-none" style={{ padding: '10px 12px' }} title="Bohu — bientôt disponible">
            <span className="flex items-center justify-center rounded-md flex-shrink-0" style={{ width: 21, height: 21, background: 'var(--violet, #6E50C8)' }}>
              <svg width="15" height="15" viewBox="43 25 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g transform="translate(6,-5)" fill="#fff">
                  <line x1="60" y1="62" x2="80" y2="42" stroke="#fff" strokeWidth="2.6" />
                  <line x1="60" y1="62" x2="94" y2="66" stroke="#fff" strokeWidth="2.6" />
                  <line x1="60" y1="62" x2="76" y2="90" stroke="#fff" strokeWidth="2.6" />
                  <line x1="60" y1="62" x2="52" y2="46" stroke="#fff" strokeWidth="2.6" />
                  <circle cx="80" cy="42" r="4.6" /><circle cx="94" cy="66" r="4" /><circle cx="76" cy="90" r="4" /><circle cx="52" cy="46" r="3.6" /><circle cx="60" cy="62" r="7.6" />
                </g>
              </svg>
            </span>
            <span className="flex-1 text-left font-semibold text-muted-foreground" style={{ fontSize: '13px' }}>Bohu</span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Bientôt
            </span>
          </div>

          {mainItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => go(item.path)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-[11px] rounded-lg transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
              }`}
              style={{ padding: '10px 12px' }}
            >
              <item.icon className="size-[18px] flex-shrink-0" />
              <span className="flex-1 text-left font-semibold" style={{ fontSize: '13px' }}>{item.label}</span>
            </motion.button>
          ))}
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
                className={`w-full flex items-center gap-[11px] rounded-lg transition-all duration-150 ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-lavender-100 hover:text-foreground'
                }`}
                style={{ padding: '10px 12px' }}
              >
                <item.icon className="size-4 flex-shrink-0" />
                <span className="flex-1 text-left font-semibold" style={{ fontSize: '13px' }}>{item.label}</span>
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
