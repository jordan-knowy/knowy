import { useState } from 'react';
import { Menu, Search, Sparkles, Users, TrendingUp, AlertTriangle, Mail, Building2, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import Sidebar from './Sidebar';
import Notifications from './Notifications';
import { Button } from './design-system';

interface LayoutProps {
  children: React.ReactNode;
}

interface SearchSuggestion {
  type: 'query' | 'action' | 'contact' | 'meeting';
  icon: any;
  title: string;
  subtitle: string;
  action: string;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const searchSuggestions: SearchSuggestion[] = [
    {
      type: 'query',
      icon: Users,
      title: 'Qui peut m\'introduire chez Stripe?',
      subtitle: 'Analyse réseau 2nd degré LinkedIn',
      action: '/contacts'
    },
    {
      type: 'query',
      icon: TrendingUp,
      title: 'Deals avec <50% closing prob',
      subtitle: '3 deals trouvés • Actions recommandées',
      action: '/analyse'
    },
    {
      type: 'query',
      icon: AlertTriangle,
      title: 'Comptes sans meeting depuis 1 mois',
      subtitle: '5 comptes à risque détectés',
      action: '/contacts'
    },
    {
      type: 'action',
      icon: Mail,
      title: 'Draft email follow-up Qonto',
      subtitle: 'Génération IA en 1 clic',
      action: '/meeting/4'
    },
    {
      type: 'query',
      icon: Building2,
      title: 'Qui parle à nos concurrents?',
      subtitle: 'Competitive intelligence • 8 signaux',
      action: '/organisation'
    },
    {
      type: 'query',
      icon: Users,
      title: 'Qui devrait parler à Sarah Chen?',
      subtitle: 'AI matchmaking • DISC + expertise',
      action: '/contacts'
    }
  ];

  const getFilteredSuggestions = () => {
    if (!searchQuery) return searchSuggestions;
    return searchSuggestions.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    setIsSearchFocused(false);
    navigate(suggestion.action);
  };

  return (
    <div className="size-full flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex size-full flex-1 flex-col lg:ml-[220px]">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4 md:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Ouvrir la navigation"
                icon={<Menu className="size-5" />}
                onClick={() => setIsSidebarOpen(true)}
              />
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-primary" />
                <input
                  type="text"
                  placeholder="Demandez n'importe quoi à Knowy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  aria-label="Recherche intelligente Knowy"
                  className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm"
                />
              </div>
              <Notifications />
            </div>

            {/* Search Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-lg border-2 border-primary/20 bg-card shadow-2xl md:left-8 md:right-8">
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <p className="text-xs font-semibold text-primary">IA Knowy • Recherche intelligente</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getFilteredSuggestions().length} résultats
                  </p>
                </div>
                <div className="p-2 max-h-[400px] overflow-auto">
                  {getFilteredSuggestions().length > 0 ? (
                    getFilteredSuggestions().map((suggestion, i) => (
                      <button
                        key={i}
                        className="w-full rounded-lg px-4 py-3 text-left transition-all hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
                        onMouseDown={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            suggestion.type === 'action' ? 'bg-primary/10' : 'bg-accent/10'
                          }`}>
                            <suggestion.icon className={`size-5 ${
                              suggestion.type === 'action' ? 'text-primary' : 'text-accent'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {suggestion.title}
                              </h4>
                              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {suggestion.subtitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <div className="size-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
                      <p className="text-xs text-muted-foreground mt-1">Essayez une autre recherche</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions Footer */}
                {searchQuery && getFilteredSuggestions().length > 0 && (
                  <div className="border-t border-border p-3 bg-muted/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="size-3" />
                        Appuyez sur Entrée pour rechercher
                      </span>
                      <button className="text-primary hover:underline font-medium">
                        Voir tous les résultats
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
