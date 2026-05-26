import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  Search,
  Mail,
  Calendar,
  TrendingUp,
  Building2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Filter,
  ChevronDown,
  Zap,
  Star
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  photo: string;
  engagementScore: number;
  emails30d: number;
  meetings30d: number;
  lastContactDays: number;
  isDecisionMaker: boolean;
  signals: ('hot' | 'new-role' | 'mutual' | 'risk')[];
}

interface Company {
  id: string;
  name: string;
  logo: string;
  activeContacts: number;
  totalContacts: number;
  emails30d: number;
  meetings30d: number;
  healthScore: number;
  lastContactDays: number;
  signals: ('hot' | 'risk' | 'expansion')[];
}

type SortType = 'signals' | 'engagement' | 'risk' | 'deciders' | 'emails';

export default function Contacts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'people' | 'companies'>('people');
  const [sortBy, setSortBy] = useState<SortType>('signals');
  const [displayCount, setDisplayCount] = useState(25);

  // Generate realistic contacts (143 total)
  const allContacts: Contact[] = [
    // High priority contacts with signals
    { id: '1', name: 'Sarah Chen', role: 'VP of Partnerships', company: 'Contentsquare', photo: '👩‍💼', engagementScore: 88, emails30d: 24, meetings30d: 3, lastContactDays: 2, isDecisionMaker: true, signals: ['hot', 'new-role', 'mutual'] },
    { id: '2', name: 'Alexandre Garcia', role: 'CFO', company: 'Qonto', photo: '👨‍💼', engagementScore: 94, emails30d: 45, meetings30d: 5, lastContactDays: 1, isDecisionMaker: true, signals: ['hot'] },
    { id: '3', name: 'Marc Dubois', role: 'Head of Product Strategy', company: 'Contentsquare', photo: '👨‍💻', engagementScore: 72, emails30d: 12, meetings30d: 2, lastContactDays: 5, isDecisionMaker: true, signals: ['risk'] },
    { id: '4', name: 'Julie Martin', role: 'Enterprise Sales Director', company: 'Swile', photo: '👩', engagementScore: 85, emails30d: 18, meetings30d: 3, lastContactDays: 3, isDecisionMaker: true, signals: [] },
    { id: '5', name: 'Thomas Lebrun', role: 'Customer Success Manager', company: 'Alan', photo: '👨', engagementScore: 76, emails30d: 32, meetings30d: 4, lastContactDays: 6, isDecisionMaker: false, signals: ['risk'] },
    { id: '6', name: 'Emma Wilson', role: 'Partnerships Lead', company: 'Contentsquare', photo: '👩‍💼', engagementScore: 68, emails30d: 8, meetings30d: 1, lastContactDays: 12, isDecisionMaker: false, signals: ['risk'] },
    { id: '7', name: 'Pierre Durand', role: 'VP Sales', company: 'Stripe', photo: '👨‍💼', engagementScore: 71, emails30d: 15, meetings30d: 2, lastContactDays: 8, isDecisionMaker: true, signals: [] },
    { id: '8', name: 'Claire Moreau', role: 'Product Manager', company: 'PayFit', photo: '👩', engagementScore: 65, emails30d: 6, meetings30d: 1, lastContactDays: 15, isDecisionMaker: false, signals: ['risk'] },
    { id: '9', name: 'Jean Martin', role: 'Director of BD', company: 'BlaBlaCar', photo: '👨‍💼', engagementScore: 73, emails30d: 21, meetings30d: 2, lastContactDays: 7, isDecisionMaker: true, signals: ['mutual'] },
    { id: '10', name: 'Sophie Laurent', role: 'CEO', company: 'Doctolib', photo: '👩‍💼', engagementScore: 82, emails30d: 28, meetings30d: 3, lastContactDays: 4, isDecisionMaker: true, signals: ['hot'] },

    // More contacts (mix of active and at-risk)
    { id: '11', name: 'Antoine Rousseau', role: 'CTO', company: 'Qonto', photo: '👨‍💻', engagementScore: 79, emails30d: 19, meetings30d: 2, lastContactDays: 5, isDecisionMaker: true, signals: [] },
    { id: '12', name: 'Camille Bernard', role: 'VP Marketing', company: 'Alan', photo: '👩', engagementScore: 74, emails30d: 16, meetings30d: 2, lastContactDays: 9, isDecisionMaker: true, signals: [] },
    { id: '13', name: 'Lucas Petit', role: 'Sales Manager', company: 'Swile', photo: '👨', engagementScore: 70, emails30d: 14, meetings30d: 2, lastContactDays: 6, isDecisionMaker: false, signals: [] },
    { id: '14', name: 'Marie Dubois', role: 'Head of Partnerships', company: 'Stripe', photo: '👩‍💼', engagementScore: 77, emails30d: 22, meetings30d: 3, lastContactDays: 3, isDecisionMaker: true, signals: ['mutual'] },
    { id: '15', name: 'Nicolas Lefebvre', role: 'Account Executive', company: 'PayFit', photo: '👨', engagementScore: 63, emails30d: 9, meetings30d: 1, lastContactDays: 14, isDecisionMaker: false, signals: ['risk'] },
    { id: '16', name: 'Isabelle Moreau', role: 'VP Operations', company: 'BlaBlaCar', photo: '👩', engagementScore: 81, emails30d: 25, meetings30d: 3, lastContactDays: 2, isDecisionMaker: true, signals: ['hot'] },
    { id: '17', name: 'François Girard', role: 'Product Lead', company: 'Doctolib', photo: '👨‍💻', engagementScore: 69, emails30d: 11, meetings30d: 1, lastContactDays: 11, isDecisionMaker: false, signals: ['risk'] },
    { id: '18', name: 'Nathalie Roux', role: 'CFO', company: 'Contentsquare', photo: '👩‍💼', engagementScore: 86, emails30d: 31, meetings30d: 4, lastContactDays: 3, isDecisionMaker: true, signals: ['hot'] },
    { id: '19', name: 'Olivier Simon', role: 'Director Sales', company: 'Qonto', photo: '👨‍💼', engagementScore: 75, emails30d: 17, meetings30d: 2, lastContactDays: 7, isDecisionMaker: true, signals: [] },
    { id: '20', name: 'Julien Lambert', role: 'CSM', company: 'Alan', photo: '👨', engagementScore: 67, emails30d: 13, meetings30d: 2, lastContactDays: 10, isDecisionMaker: false, signals: ['risk'] },

    // Additional 60 contacts for realism (mix of companies)
    ...Array.from({ length: 60 }, (_, i) => ({
      id: `${21 + i}`,
      name: `Contact ${21 + i}`,
      role: ['VP Sales', 'Account Manager', 'CEO', 'CTO', 'Director', 'Manager'][Math.floor(Math.random() * 6)],
      company: ['Contentsquare', 'Qonto', 'Swile', 'Alan', 'Stripe', 'PayFit', 'BlaBlaCar', 'Doctolib', 'Ledger', 'Aircall', 'Spendesk', 'Pennylane'][Math.floor(Math.random() * 12)],
      photo: ['👨‍💼', '👩‍💼', '👨', '👩', '👨‍💻', '👩‍💻'][Math.floor(Math.random() * 6)],
      engagementScore: Math.floor(Math.random() * 40) + 50,
      emails30d: Math.floor(Math.random() * 30) + 2,
      meetings30d: Math.floor(Math.random() * 4),
      lastContactDays: Math.floor(Math.random() * 20) + 1,
      isDecisionMaker: Math.random() > 0.6,
      signals: Math.random() > 0.7 ? ['risk'] : []
    }))
  ];

  const companies: Company[] = [
    { id: 'c1', name: 'Contentsquare', logo: '🎯', activeContacts: 8, totalContacts: 12, emails30d: 127, meetings30d: 6, healthScore: 95, lastContactDays: 2, signals: ['hot', 'risk'] },
    { id: 'c2', name: 'Qonto', logo: '💳', activeContacts: 6, totalContacts: 8, emails30d: 184, meetings30d: 9, healthScore: 92, lastContactDays: 1, signals: ['hot'] },
    { id: 'c3', name: 'Swile', logo: '🍔', activeContacts: 3, totalContacts: 5, emails30d: 68, meetings30d: 4, healthScore: 88, lastContactDays: 3, signals: ['risk'] },
    { id: 'c4', name: 'Alan', logo: '💙', activeContacts: 4, totalContacts: 7, emails30d: 112, meetings30d: 7, healthScore: 82, lastContactDays: 6, signals: ['risk'] },
    { id: 'c5', name: 'Stripe', logo: '💳', activeContacts: 2, totalContacts: 5, emails30d: 43, meetings30d: 3, healthScore: 71, lastContactDays: 8, signals: [] },
    { id: 'c6', name: 'PayFit', logo: '💰', activeContacts: 2, totalContacts: 4, emails30d: 31, meetings30d: 2, healthScore: 65, lastContactDays: 15, signals: ['risk'] },
    { id: 'c7', name: 'BlaBlaCar', logo: '🚗', activeContacts: 3, totalContacts: 4, emails30d: 56, meetings30d: 3, healthScore: 77, lastContactDays: 7, signals: [] },
    { id: 'c8', name: 'Doctolib', logo: '🏥', activeContacts: 3, totalContacts: 5, emails30d: 72, meetings30d: 4, healthScore: 80, lastContactDays: 4, signals: ['hot'] },
  ];

  const getSortedContacts = () => {
    let sorted = [...allContacts];

    switch (sortBy) {
      case 'signals':
        sorted.sort((a, b) => b.signals.length - a.signals.length || b.engagementScore - a.engagementScore);
        break;
      case 'engagement':
        sorted.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'risk':
        sorted.sort((a, b) => b.lastContactDays - a.lastContactDays);
        break;
      case 'deciders':
        sorted = sorted.filter(c => c.isDecisionMaker).sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'emails':
        sorted.sort((a, b) => b.emails30d - a.emails30d);
        break;
    }

    if (searchQuery) {
      sorted = sorted.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sorted;
  };

  const getFilteredCompanies = () => {
    let filtered = [...companies];

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.healthScore - a.healthScore);
  };

  const sortedContacts = getSortedContacts();
  const displayedContacts = sortedContacts.slice(0, displayCount);
  const filteredCompanies = getFilteredCompanies();
  const activeContacts = allContacts.filter(c => c.lastContactDays <= 30).length;
  const totalSignals = allContacts.filter(c => c.signals.length > 0).length;

  const getDaysText = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `${days}j`;
    if (days < 30) return `${Math.floor(days / 7)}sem`;
    return `${Math.floor(days / 30)}m`;
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'hot': return '🔥';
      case 'new-role': return '⚡';
      case 'mutual': return '🤝';
      case 'risk': return '⚠️';
      case 'expansion': return '📈';
      default: return '';
    }
  };

  const sortOptions = [
    { value: 'signals', label: '⚡ Signaux actifs', icon: Zap },
    { value: 'engagement', label: '📊 Engagement', icon: TrendingUp },
    { value: 'risk', label: '⏰ À risque', icon: AlertTriangle },
    { value: 'deciders', label: '🎯 Décideurs', icon: Star },
    { value: 'emails', label: '📧 Volume emails', icon: Mail }
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-semibold mb-2">Intelligence Relationnelle</h1>
              <p className="text-muted-foreground flex items-center gap-4">
                <span className="font-medium">{allContacts.length} contacts</span>
                <span className="text-xs">•</span>
                <span>{activeContacts} actifs (30j)</span>
                <span className="text-xs">•</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3 text-primary" />
                  {totalSignals} signaux détectés
                </span>
              </p>
            </div>
            <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-colors flex items-center gap-2 font-medium">
              <Sparkles className="size-4" />
              Analyser
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('people')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  viewType === 'people'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                <Users className="size-4" />
                Personnes
              </button>
              <button
                onClick={() => setViewType('companies')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  viewType === 'companies'
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                <Building2 className="size-4" />
                Entreprises
              </button>
            </div>

            {/* Search */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
        </motion.div>

        {viewType === 'people' ? (
          <>
            {/* Sort Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 flex items-center gap-3"
            >
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tri:</span>
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortType)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm flex items-center gap-1.5 ${
                    sortBy === option.value
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border hover:bg-muted/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>

            {/* Dense Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground">
                <div className="col-span-3">Contact</div>
                <div className="col-span-2">Entreprise</div>
                <div className="col-span-2 text-center">Engagement</div>
                <div className="col-span-1 text-center">Emails<br/>(30j)</div>
                <div className="col-span-1 text-center">Meetings<br/>(30j)</div>
                <div className="col-span-1 text-center">Dernier<br/>Contact</div>
                <div className="col-span-1 text-center">Signaux</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-border">
                {displayedContacts.map((contact, i) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/contact/${contact.id}`)}
                  >
                    {/* Contact */}
                    <div className="col-span-3 flex items-center gap-3">
                      <span className="text-2xl">{contact.photo}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{contact.name}</p>
                          {contact.isDecisionMaker && (
                            <Star className="size-3 text-primary fill-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm truncate">{contact.company}</p>
                    </div>

                    {/* Engagement Score */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      <div className="w-full max-w-[120px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold">{contact.engagementScore}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5">
                          <div
                            className={`rounded-full h-1.5 transition-all ${
                              contact.engagementScore >= 80 ? 'bg-success' :
                              contact.engagementScore >= 70 ? 'bg-primary' :
                              contact.engagementScore >= 60 ? 'bg-warning' :
                              'bg-destructive'
                            }`}
                            style={{ width: `${contact.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Emails */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm font-medium">{contact.emails30d}</span>
                      <span className="text-xs text-muted-foreground ml-0.5">↔️</span>
                    </div>

                    {/* Meetings */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className="text-sm font-medium">{contact.meetings30d}</span>
                    </div>

                    {/* Last Contact */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className={`text-sm font-medium ${
                        contact.lastContactDays > 10 ? 'text-destructive' :
                        contact.lastContactDays > 5 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {getDaysText(contact.lastContactDays)}
                      </span>
                    </div>

                    {/* Signals */}
                    <div className="col-span-1 flex items-center justify-center gap-0.5">
                      {contact.signals.length > 0 ? (
                        contact.signals.map((signal, idx) => (
                          <span key={idx} className="text-base">{getSignalIcon(signal)}</span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Load More */}
            {displayCount < sortedContacts.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => setDisplayCount(displayCount + 25)}
                  className="px-6 py-3 bg-card hover:bg-muted/50 border border-border rounded-xl transition-colors flex items-center gap-2 mx-auto"
                >
                  <ChevronDown className="size-4" />
                  Charger 25 contacts de plus ({sortedContacts.length - displayCount} restants)
                </button>
              </motion.div>
            )}
          </>
        ) : (
          /* Companies View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground">
              <div className="col-span-3">Entreprise</div>
              <div className="col-span-2 text-center"># Contacts<br/>actifs</div>
              <div className="col-span-2 text-center">Email Vol<br/>(30j)</div>
              <div className="col-span-1 text-center">Meetings<br/>(30j)</div>
              <div className="col-span-2 text-center">Health Score</div>
              <div className="col-span-1 text-center">Dernier<br/>Contact</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border">
              {filteredCompanies.map((company, i) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/company/${company.id}`)}
                >
                  {/* Company */}
                  <div className="col-span-3 flex items-center gap-3">
                    <span className="text-3xl">{company.logo}</span>
                    <p className="font-semibold">{company.name}</p>
                  </div>

                  {/* Contacts */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <p className="text-sm font-semibold">{company.activeContacts} contacts</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((company.activeContacts / company.totalContacts) * 100)}% coverage
                    </p>
                  </div>

                  {/* Emails */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-medium">{company.emails30d}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">↔️</span>
                  </div>

                  {/* Meetings */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm font-medium">{company.meetings30d}</span>
                  </div>

                  {/* Health Score */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[120px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{company.healthScore}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className={`rounded-full h-1.5 transition-all ${
                            company.healthScore >= 80 ? 'bg-success' :
                            company.healthScore >= 70 ? 'bg-primary' :
                            company.healthScore >= 60 ? 'bg-warning' :
                            'bg-destructive'
                          }`}
                          style={{ width: `${company.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last Contact */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <span className={`text-sm font-medium ${
                      company.lastContactDays > 10 ? 'text-destructive' :
                      company.lastContactDays > 5 ? 'text-warning' :
                      'text-success'
                    }`}>
                      {getDaysText(company.lastContactDays)}
                    </span>
                    {company.signals.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {company.signals.map((signal, idx) => (
                          <span key={idx} className="text-xs">{getSignalIcon(signal)}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex items-center justify-end">
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
