import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';
import { listContacts } from '../../lib/api/contacts';
import { Search, TrendingUp, Minus, TrendingDown, AlertCircle, Building2, User, Mail, Calendar, MessageSquare, ArrowRight, Database, X, CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyButton from './knowy/KnowyButton';
import KnowyBadge from './knowy/KnowyBadge';

type Phase = 'growth' | 'stagnant' | 'decline';
type AlertType = 'cooling' | 'job_change' | 'news';

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  companyLogo: string;
  engagementScore: number;
  scoreEvolution: number; // +12 ou -5
  phase: Phase;
  phaseDuration: string;
  lastContactDate: string;
  lastContactType: 'email' | 'meeting' | 'slack';
  crmSynced: boolean;
  alert?: {
    type: AlertType;
    message: string;
  };
}

export default function Relations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'growth' | 'stagnant' | 'decline' | 'alerts'>('all');
  const [showUnsyncedPopup, setShowUnsyncedPopup] = useState(false);
  const [contactSyncs, setContactSyncs] = useState<Record<string, boolean>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadContacts() {
      // 1. Load base contacts (Supabase → fallback mock)
      const baseContacts = await listContacts();
      if (!mounted) return;

      // 2. Try to enrich with relationship_snapshots
      let snapshots: Record<string, any> = {};
      let alerts: Record<string, any> = {};
      if (supabase) {
        const orgId = await getActiveOrganizationId();
        if (orgId) {
          const { data: snaps } = await supabase
            .from('relationship_snapshots')
            .select('contact_id, engagement_score, score_evolution, phase, phase_started_at, last_contact_at, last_contact_type, crm_synced')
            .eq('organization_id', orgId)
            .order('snapshot_date', { ascending: false });
          // Keep only latest per contact
          (snaps ?? []).forEach((s: any) => {
            if (!snapshots[s.contact_id]) snapshots[s.contact_id] = s;
          });

          const { data: alertRows } = await supabase
            .from('contact_alerts')
            .select('contact_id, alert_type, message')
            .eq('organization_id', orgId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });
          (alertRows ?? []).forEach((a: any) => {
            if (!alerts[a.contact_id]) alerts[a.contact_id] = a;
          });
        }
      }

      if (!mounted) return;

      const mapped: Contact[] = baseContacts.map(c => {
        const snap = snapshots[c.id];
        const alert = alerts[c.id];
        const phaseStarted = snap?.phase_started_at ? new Date(snap.phase_started_at) : null;
        const phaseDurationLabel = phaseStarted
          ? `depuis ${Math.round((Date.now() - phaseStarted.getTime()) / (1000 * 60 * 60 * 24 * 7))} semaines`
          : '';
        const lastContact = snap?.last_contact_at ? new Date(snap.last_contact_at) : null;
        const daysAgo = lastContact
          ? Math.round((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const lastContactLabel = daysAgo != null
          ? daysAgo === 0 ? "Aujourd'hui" : daysAgo === 1 ? 'Hier' : `Il y a ${daysAgo} jours`
          : '—';
        return {
          id: c.id,
          name: c.name,
          title: c.title ?? '',
          company: c.company ?? '',
          companyLogo: c.company ? c.company[0].toUpperCase() : '🏢',
          engagementScore: snap?.engagement_score ?? 0,
          scoreEvolution: snap?.score_evolution ?? 0,
          phase: (snap?.phase as Phase) ?? 'stagnant',
          phaseDuration: phaseDurationLabel,
          lastContactDate: lastContactLabel,
          lastContactType: (snap?.last_contact_type as Contact['lastContactType']) ?? 'email',
          crmSynced: snap?.crm_synced ?? false,
          alert: alert ? { type: alert.alert_type as AlertType, message: alert.message } : undefined,
        };
      });

      setContacts(mapped);
      setLoading(false);
    }
    loadContacts();
    return () => { mounted = false; };
  }, []);

  const getPhaseConfig = (phase: Phase) => {
    const configs = {
      growth: {
        label: 'Développement',
        icon: TrendingUp,
        color: 'text-success',
        bgColor: 'bg-success/10',
        variant: 'sage' as const
      },
      stagnant: {
        label: 'Stagnation',
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        variant: 'muted' as const
      },
      decline: {
        label: 'Décroissance',
        icon: TrendingDown,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        variant: 'coral' as const
      }
    };
    return configs[phase];
  };

  const getScoreColor = (score: number) => {
    if (score > 65) return 'text-success';
    if (score >= 35) return 'text-amber-600';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score > 65) return 'bg-success/10';
    if (score >= 35) return 'bg-amber-600/10';
    return 'bg-destructive/10';
  };

  const getScoreLabel = (score: number) => {
    if (score > 65) return 'Élevé';
    if (score >= 35) return 'Modéré';
    return 'Faible';
  };

  const getAlertConfig = (type: AlertType) => {
    const configs = {
      cooling: { color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertCircle },
      job_change: { color: 'text-amber-600', bgColor: 'bg-amber-600/10', icon: AlertCircle },
      news: { color: 'text-success', bgColor: 'bg-success/10', icon: TrendingUp }
    };
    return configs[type];
  };

  const getContactIcon = (type: 'email' | 'meeting' | 'slack') => {
    const icons = {
      email: Mail,
      meeting: Calendar,
      slack: MessageSquare
    };
    return icons[type];
  };

  const toggleContactSync = (contactId: string, currentSync: boolean) => {
    setContactSyncs(prev => ({ ...prev, [contactId]: !currentSync }));
  };

  const syncAllUnsynced = () => {
    const unsyncedIds = contacts
      .filter(c => !getContactSyncStatus(c))
      .reduce((acc, c) => ({ ...acc, [c.id]: true }), {});
    setContactSyncs(prev => ({ ...prev, ...unsyncedIds }));
    setShowUnsyncedPopup(false);
  };

  const getContactSyncStatus = (contact: Contact) => {
    return contactSyncs[contact.id] !== undefined ? contactSyncs[contact.id] : contact.crmSynced;
  };

  const syncedCount = contacts.filter(c => getContactSyncStatus(c)).length;
  const totalCount = contacts.length;
  const unsyncedContacts = contacts.filter(c => !getContactSyncStatus(c));

  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !contact.name.toLowerCase().includes(query) &&
        !contact.company.toLowerCase().includes(query) &&
        !contact.title.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Phase/Alert filter
    if (activeFilter === 'growth' && contact.phase !== 'growth') return false;
    if (activeFilter === 'stagnant' && contact.phase !== 'stagnant') return false;
    if (activeFilter === 'decline' && contact.phase !== 'decline') return false;
    if (activeFilter === 'alerts' && !contact.alert) return false;

    return true;
  });

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="mb-2">Mémoire Relationnelle</h1>
              <p className="text-muted-foreground">
                {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} • Intelligence persistante
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Synchronisation CRM</p>
                </div>
                <p className="text-2xl font-black">
                  <span className="text-success">{syncedCount}</span>
                  <span className="text-muted-foreground"> / {totalCount}</span>
                </p>
              </div>

              {unsyncedContacts.length > 0 && (
                <KnowyButton
                  variant="secondary"
                  size="md"
                  icon={<AlertCircle className="size-4" />}
                  onClick={() => setShowUnsyncedPopup(true)}
                >
                  Voir non synchronisées ({unsyncedContacts.length})
                </KnowyButton>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setActiveFilter('growth')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeFilter === 'growth'
                ? 'bg-success text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="size-4" />
            Développement
          </button>
          <button
            onClick={() => setActiveFilter('stagnant')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeFilter === 'stagnant'
                ? 'bg-muted text-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Minus className="size-4" />
            Stagnation
          </button>
          <button
            onClick={() => setActiveFilter('decline')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeFilter === 'decline'
                ? 'bg-destructive text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="size-4" />
            Décroissance
          </button>
          <button
            onClick={() => setActiveFilter('alerts')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeFilter === 'alerts'
                ? 'bg-amber-600 text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle className="size-4" />
            Alertes
          </button>
        </motion.div>

        {/* Contacts List */}
        <div className="space-y-3">
          {filteredContacts.map((contact, i) => {
            const phaseConfig = getPhaseConfig(contact.phase);
            const PhaseIcon = phaseConfig.icon;
            const ContactIcon = getContactIcon(contact.lastContactType);
            const alertConfig = contact.alert ? getAlertConfig(contact.alert.type) : null;
            const AlertIcon = alertConfig?.icon;

            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                <KnowyCard
                  hover
                  onClick={() => navigate(`/relation/${contact.id}`)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Column 1 - Identity */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`size-10 rounded-lg ${phaseConfig.bgColor} ${phaseConfig.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-0.5 truncate">{contact.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-base">{contact.companyLogo}</span>
                          <span className="text-xs font-medium">{contact.company}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 - Engagement Score */}
                    <div className="flex flex-row items-center justify-between gap-3 rounded-xl bg-muted/20 p-3 lg:min-w-[100px] lg:flex-col lg:bg-transparent lg:p-0">
                      <div className="flex items-center gap-2">
                        <div className={`size-12 rounded-full ${getScoreBgColor(contact.engagementScore)} flex items-center justify-center`}>
                          <span className={`font-mono font-bold text-lg ${getScoreColor(contact.engagementScore)}`}>
                            {contact.engagementScore}
                          </span>
                        </div>
                        {contact.scoreEvolution !== 0 && (
                          <div className={`flex items-center gap-0.5 ${
                            contact.scoreEvolution > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {contact.scoreEvolution > 0 ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )}
                            <span className="text-xs font-bold">{Math.abs(contact.scoreEvolution)}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${getScoreColor(contact.engagementScore)}`}>
                        {getScoreLabel(contact.engagementScore)}
                      </span>
                    </div>

                    {/* Column 3 - Phase */}
                    <div className="flex flex-row items-center justify-between gap-3 rounded-xl bg-muted/20 p-3 lg:min-w-[130px] lg:flex-col lg:bg-transparent lg:p-0">
                      <KnowyBadge variant={phaseConfig.variant} size="sm" className="flex items-center gap-1">
                        <PhaseIcon className="size-3" />
                        {phaseConfig.label}
                      </KnowyBadge>
                      <span className="text-xs text-muted-foreground">{contact.phaseDuration}</span>
                    </div>

                    {/* Column 4 - Last Contact */}
                    <div className="flex flex-row items-center justify-between gap-3 rounded-xl bg-muted/20 p-3 lg:min-w-[120px] lg:flex-col lg:bg-transparent lg:p-0">
                      <div className="flex items-center gap-1.5">
                        <ContactIcon className="size-3 text-muted-foreground" />
                        <span className="text-xs">{contact.lastContactDate}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{contact.lastContactType}</span>
                    </div>

                    {/* Column 5 - Alert */}
                    <div className="lg:min-w-[160px]">
                      {contact.alert && alertConfig && AlertIcon && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${alertConfig.bgColor}`}>
                          <AlertIcon className={`size-3 ${alertConfig.color}`} />
                          <span className={`text-xs font-medium ${alertConfig.color}`}>
                            {contact.alert.message}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Column 6 - Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <KnowyButton
                        variant="primary"
                        size="sm"
                        icon={<ArrowRight className="size-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/relation/${contact.id}`);
                        }}
                      >
                        Voir profil
                      </KnowyButton>
                    </div>
                  </div>
                </KnowyCard>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="size-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun contact trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}"`
                : 'Aucun contact ne correspond aux filtres sélectionnés'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Popup Contacts Non Synchronisés */}
      <AnimatePresence>
        {showUnsyncedPopup && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowUnsyncedPopup(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                  <div>
                    <h2 className="text-2xl font-black mb-1">Fiches non synchronisées</h2>
                    <p className="text-sm text-muted-foreground">
                      {unsyncedContacts.length} contact{unsyncedContacts.length > 1 ? 's' : ''} à synchroniser avec le CRM
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUnsyncedPopup(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="size-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-3">
                    {unsyncedContacts.map((contact) => {
                      const phaseConfig = getPhaseConfig(contact.phase);
                      const isSynced = getContactSyncStatus(contact);

                      return (
                        <div key={contact.id} className="p-4 bg-muted/20 rounded-xl border border-border">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className={`size-12 rounded-lg ${phaseConfig.bgColor} ${phaseConfig.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base mb-1">{contact.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{contact.title} · {contact.company}</p>
                            </div>

                            {/* Sync Button */}
                            <button
                              onClick={() => toggleContactSync(contact.id, isSynced)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                                isSynced
                                  ? 'bg-success/10 text-success border-2 border-success'
                                  : 'bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90'
                              }`}
                            >
                              {isSynced ? (
                                <>
                                  <CheckCircle2 className="size-4" />
                                  Synchronisé
                                </>
                              ) : (
                                <>
                                  <Database className="size-4" />
                                  Synchroniser
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {unsyncedContacts.filter(c => getContactSyncStatus(c)).length} / {unsyncedContacts.length} synchronisé{unsyncedContacts.filter(c => getContactSyncStatus(c)).length > 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <KnowyButton
                      variant="ghost"
                      size="md"
                      onClick={() => setShowUnsyncedPopup(false)}
                    >
                      Fermer
                    </KnowyButton>
                    <KnowyButton
                      variant="primary"
                      size="md"
                      icon={<Database className="size-4" />}
                      onClick={syncAllUnsynced}
                    >
                      Tout synchroniser
                    </KnowyButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
