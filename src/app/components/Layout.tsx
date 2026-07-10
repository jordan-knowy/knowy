import { useState } from 'react';
import { Plus, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './Sidebar';
import Notifications from './Notifications';
import GlobalSearch from './knowr/GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

// Titre/sous-titre de topbar — reproduit TITLES de la maquette (spec Connecteurs/Home/Comptes/Personnes/Mon compte).
function getPageTitle(pathname: string, search: string): [string, string] | null {
  if (pathname === '/dashboard') return ['Home', 'Mon espace relationnel'];
  if (pathname === '/meetings') return ['Réunions', 'Vos réunions et briefs'];
  if (pathname === '/companies') return ['Comptes', 'Entreprises enregistrées'];
  if (pathname === '/contacts') return ['Personnes', 'Contacts enregistrés'];
  if (pathname === '/account' && search.includes('tab=connections')) return ['Connecteurs', 'Sources connectées & précision du graphe'];
  if (pathname === '/account') return ['Mon compte', 'Profil & abonnement'];
  if (pathname === '/subscription') return ['Abonnement', 'Ton plan Tohu'];
  return null;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pageTitle = getPageTitle(location.pathname, location.search);
  const isDetailRoute = /^\/(company|contact|meeting)\//.test(location.pathname);

  return (
    <div className="size-full flex overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {isMobileNavOpen && (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-[238px] transition-transform duration-200 md:hidden ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
      </div>
      <div className="flex-1 size-full min-w-0 flex flex-col md:ml-[238px]">
        {/* Sticky Topbar — titre/sous-titre de page (maquette .topbar/.tb-title/.tb-sub) */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 md:px-8 md:py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={isMobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden"
                onClick={() => setIsMobileNavOpen((open) => !open)}
              >
                {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              {isDetailRoute && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card flex-shrink-0"
                  style={{ padding: '9px 15px', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 800, color: 'var(--t2, #5A4880)' }}
                >
                  ← Retour
                </button>
              )}

              {pageTitle && (
                <div className="hidden sm:block flex-shrink-0">
                  <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--t1, #1A1040)', lineHeight: 1.2 }}>{pageTitle[0]}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--t3, #9082B8)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.05em' }}>{pageTitle[1]}</div>
                </div>
              )}

              {/* Recherche globale unique */}
              <GlobalSearch className="flex-1" />

              {/* Nouveau brief */}
              <button
                onClick={() => navigate('/brief-externe')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#6E50C8' }}
              >
                <Plus className="size-4" /> <span className="hidden sm:inline">Nouveau brief</span>
              </button>

              {/* Cloche notifications */}
              <Notifications />
            </div>
          </div>
        </div>

        {/* Page Content — animation d'entrée de page (charte : ease maquette) */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
