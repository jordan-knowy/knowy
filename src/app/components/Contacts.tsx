import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Users,
  Search,
  Mail,
  Calendar,
  Building2,
  ArrowRight,
  Sparkles,
  Filter,
  ChevronDown,
  Star,
  Loader2,
  RefreshCw,
  Plus,
  X,
  Upload,
  Linkedin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Brain,
  UserPlus,
  ChevronUp,
} from 'lucide-react';
import PageHeader from './knowr/PageHeader';
import Coachmark from './knowr/Coachmark';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface SuggestedContact {
  email: string;
  name: string;
  domain: string;
  count: number;
  lastSeen: string;
  lastSubject: string;
  lastSnippet: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string | null;
  initials: string;
  engagementScore: number;
  emailCount: number;
  meetingsCount: number;
  lastContactDays: number | null;
  isDecisionMaker: boolean;
  source: 'contact' | 'participant';
}

interface CompanyGroup {
  name: string;
  contacts: Contact[];
  meetingsTotal: number;
  lastContactDays: number | null;
}

type SortType = 'engagement' | 'risk' | 'deciders' | 'meetings' | 'alpha';

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function getDaysText(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `${days}j`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

// ─── Add Contact Modal ───────────────────────────────────────────────────────

interface AddContactModalProps {
  onClose: () => void;
  onAdded: () => void;
  orgId: string;
}

function AddContactModal({ onClose, onAdded, orgId }: AddContactModalProps) {
  const [tab, setTab] = useState<'manual' | 'pdf'>('manual');
  const [form, setForm] = useState({ firstName: '', lastName: '', role: '', company: '', email: '', linkedin: '' });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fullName = `${form.firstName} ${form.lastName}`.trim();

  async function handleManualSave() {
    if (!supabase || !fullName) return;
    setSaving(true);
    setStatus(null);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          full_name: fullName,
          role_title: form.role || null,
          email: form.email || null,
          linkedin_url: form.linkedin || null,
          source_summary: {
            company: form.company || null,
            source: 'manual',
            ai_enrichment_pending: true,
          },
        })
        .select('id')
        .single();

      if (error) throw error;

      setStatus({ type: 'success', msg: `${fullName} ajouté. L'IA va enrichir son profil automatiquement.` });
      setTimeout(() => { onAdded(); onClose(); }, 1800);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message || 'Erreur lors de l\'ajout' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePdfUpload() {
    if (!supabase || !file) return;
    setSaving(true);
    setStatus(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload PDF to storage
      const filePath = `contacts/${orgId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowy-documents')
        .upload(filePath, file, { contentType: 'application/pdf' });

      // If bucket doesn't exist yet, still create the contact with pending state
      const contactName = form.firstName || file.name.replace('.pdf', '');

      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          organization_id: orgId,
          full_name: contactName,
          role_title: form.role || null,
          email: form.email || null,
          source_summary: {
            company: form.company || null,
            source: 'pdf_upload',
            pdf_path: uploadError ? null : filePath,
            pdf_filename: file.name,
            ai_enrichment_pending: true,
          },
        });

      if (insertError) throw insertError;

      setStatus({ type: 'success', msg: `Fiche uploadée. L'IA va analyser le PDF et rédiger le profil cognitif.` });
      setTimeout(() => { onAdded(); onClose(); }, 2000);
    } catch (e: any) {
      setStatus({ type: 'error', msg: e.message || 'Erreur lors de l\'upload' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Ajouter un contact</h2>
            <p className="text-xs text-muted-foreground mt-0.5">L'IA enrichira automatiquement le profil cognitif</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="size-4" /> Saisie manuelle
          </button>
          <button
            onClick={() => setTab('pdf')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === 'pdf' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="size-4" /> Depuis un PDF
          </button>
        </div>

        <div className="p-6 space-y-4">
          {tab === 'manual' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Prénom *</label>
                  <input
                    type="text"
                    placeholder="Jean"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom *</label>
                  <input
                    type="text"
                    placeholder="Dupont"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Poste</label>
                <input
                  type="text"
                  placeholder="CEO, VP Sales..."
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Entreprise</label>
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <Mail className="size-3" /> Email <span className="opacity-60">(optionnel)</span>
                </label>
                <input
                  type="email"
                  placeholder="jean@entreprise.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                  <Linkedin className="size-3" /> LinkedIn <span className="opacity-60">(optionnel)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/jean-dupont"
                  value={form.linkedin}
                  onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Brain className="size-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  L'IA recherchera des informations publiques sur ce contact et rédigera automatiquement son profil cognitif Knowr.
                </p>
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="size-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="ml-auto">
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="size-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-1">Déposez un PDF ou cliquez pour sélectionner</p>
                    <p className="text-xs text-muted-foreground">CV, fiche entreprise, présentation, article…</p>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du contact</label>
                  <input
                    type="text"
                    placeholder="Si connu"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="optionnel"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Brain className="size-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  L'IA analysera le contenu du PDF (CV, fiche, article) et rédigera automatiquement le profil cognitif complet du contact.
                </p>
              </div>
            </>
          )}

          {status && (
            <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
              status.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="size-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />}
              {status.msg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </button>
          <button
            onClick={tab === 'manual' ? handleManualSave : handlePdfUpload}
            disabled={saving || (tab === 'manual' ? !fullName : !file)}
            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {saving ? 'Enregistrement…' : 'Ajouter et analyser'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Contacts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'people' | 'companies'>('people');
  const [sortBy, setSortBy] = useState<SortType>('meetings');
  const [displayCount, setDisplayCount] = useState(50);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [orgId, setOrgId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestedContact[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [importingEmails, setImportingEmails] = useState<Set<string>>(new Set());
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [mergingIds, setMergingIds] = useState<Set<string>>(new Set());
  const [duplicatesOpen, setDuplicatesOpen] = useState(true);
  // Suggestions de fusion refusées (persistées) — clé = emails du groupe triés
  const [dismissedDups, setDismissedDups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('knowr.dup.dismissed') ?? '[]'); } catch { return []; }
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  // Si on arrive depuis Dashboard avec ?discover=1 → lancer automatiquement la découverte
  useEffect(() => {
    if (searchParams.get('discover') === '1') {
      discoverContacts();
    }
  }, [searchParams]);

  async function loadContacts() {
    if (!supabase) return;
    setLoading(true);
    try {
      const resolvedOrgId = await getActiveOrganizationId();
      if (!resolvedOrgId) return;
      const orgId = resolvedOrgId;
      setOrgId(orgId);

      // Load contacts from contacts table with email counts and scores
      const { data: dbContacts } = await supabase
        .from('contacts')
        .select(`
          id, full_name, role_title, email, source_summary, updated_at,
          communication_messages(id),
          cognitive_profiles(engagement_score)
        `)
        .eq('organization_id', orgId)
        .is('merged_into_contact_id', null)
        .order('updated_at', { ascending: false });

      // Load participants from meeting_participants (external people from synced meetings)
      const { data: participants } = await (supabase as any)
        .from('meeting_participants')
        .select(`
          id, email, display_name, name, response_status,
          meetings!inner(id, title, company, starts_at, is_external, organization_id)
        `)
        .eq('meetings.organization_id', orgId)
        .eq('meetings.is_external', true)
        .eq('is_current_user', false)
        .not('email', 'is', null);

      const built: Contact[] = [];
      const seen = new Set<string>();

      // From contacts table
      for (const c of dbContacts || []) {
        const key = c.email?.toLowerCase() || c.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const emailCount = Array.isArray((c as any).communication_messages)
          ? (c as any).communication_messages.length
          : 0;
        const profiles = (c as any).cognitive_profiles;
        const topProfile = Array.isArray(profiles) ? profiles[0] : null;
        const engagementScore = topProfile?.engagement_score || 0;
        built.push({
          id: c.id,
          name: c.full_name || c.email || 'Contact',
          role: c.role_title || '',
          company: (c.source_summary as any)?.company || '',
          email: c.email,
          initials: initials(c.full_name || c.email || '?'),
          engagementScore,
          emailCount,
          meetingsCount: 0,
          lastContactDays: daysSince(c.updated_at),
          isDecisionMaker: false,
          source: 'contact',
        });
      }

      // From meeting participants
      const participantMap = new Map<string, { contact: Contact; count: number; lastDate: string | null }>();
      for (const p of participants || []) {
        const emailKey = (p.email || '').toLowerCase();
        if (!emailKey || seen.has(emailKey)) continue;
        const m = p.meetings;
        const displayName = p.display_name || p.name || emailKey.split('@')[0];
        const company = m?.company || emailKey.split('@')[1]?.split('.')[0] || '';

        if (participantMap.has(emailKey)) {
          const existing = participantMap.get(emailKey)!;
          existing.count++;
          if (!existing.lastDate || (m?.starts_at && m.starts_at > existing.lastDate)) {
            existing.lastDate = m?.starts_at || null;
          }
        } else {
          participantMap.set(emailKey, {
            contact: {
              id: p.id,
              name: displayName,
              role: '',
              company,
              email: p.email,
              initials: initials(displayName),
              engagementScore: 0,
              emailCount: 0,
              meetingsCount: 1,
              lastContactDays: null,
              isDecisionMaker: false,
              source: 'participant',
            },
            count: 1,
            lastDate: m?.starts_at || null,
          });
        }
      }

      for (const [, { contact, count, lastDate }] of participantMap) {
        contact.meetingsCount = count;
        contact.lastContactDays = daysSince(lastDate);
        contact.engagementScore = Math.min(100, count * 15);
        built.push(contact);
      }

      setContacts(built);
    } catch (e) {
      console.error('Contacts load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function syncEmails() {
    if (!supabase || syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const resolvedOrgId = orgId || await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers = { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' };
      const providerToken = session.provider_token;

      const { data: conns } = await supabase.from('connectors').select('provider, status, metadata')
        .eq('organization_id', resolvedOrgId).eq('status', 'connected');
      const connected = new Map((conns ?? []).map((c: any) => [c.provider as string, c]));
      const hasGoogle = connected.has('google');
      const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';

      // Sème le connecteur MS AVANT de calculer hasMicrosoft — indispensable pour les sessions fraîches
      if (isMsSession && providerToken && session.user) {
        await (supabase.from('connectors') as any).upsert({
          organization_id: resolvedOrgId, user_id: session.user.id, provider: 'microsoft', status: 'connected',
          metadata: { access_token: providerToken, refresh_token: (session as any).provider_refresh_token ?? (connected.get('microsoft')?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id,provider' });
      }
      // hasMicrosoft = connecteur en base OU session MS active avec token (premier login MS)
      const hasMicrosoft = connected.has('microsoft') || (isMsSession && !!providerToken);

      let totalSynced = 0;

      if (hasGoogle) {
        // Ne jamais utiliser le provider_token MS comme token Google. null OK : refresh serveur.
        const googleToken = (connected.get('google')?.metadata as any)?.access_token ?? (isMsSession ? null : providerToken) ?? null;
        const { data: d, error } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: resolvedOrgId, providerToken: googleToken, provider: 'google', lookbackDays: 3650 },
        });
        if (!error) totalSynced += (d as any)?.stats?.messages ?? 0;
      }

      if (hasMicrosoft) {
        const msToken: string | null = (isMsSession && providerToken) ? providerToken : ((connected.get('microsoft')?.metadata as any)?.access_token ?? null);
        const { data: d, error } = await supabase.functions.invoke('ingest-communication', {
          body: { organizationId: resolvedOrgId, providerToken: msToken, provider: 'microsoft', lookbackDays: 3650 },
        });
        if (!error) totalSynced += (d as any)?.stats?.messages ?? 0;
      }

      setSyncMsg(totalSynced > 0 ? `✓ ${totalSynced} email${totalSynced > 1 ? 's' : ''} synchronisé${totalSynced > 1 ? 's' : ''}` : '✓ Actualisé');
      await loadContacts();
    } catch (e: any) {
      setSyncMsg(`Erreur : ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }

  async function discoverContacts() {
    if (!supabase || loadingSuggestions) return;
    setLoadingSuggestions(true);
    setSuggestionError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const resolvedOrgId = orgId || await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Détecte les providers connectés
      const { data: connectors } = await supabase
        .from('connectors')
        .select('provider, metadata, status')
        .eq('organization_id', resolvedOrgId)
        .eq('status', 'connected');

      const connected = new Map((connectors ?? []).map((c: any) => [c.provider as string, c]));
      const hasGoogle = connected.has('google');
      const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
      const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';

      // Sème le connecteur MS AVANT de calculer hasMicrosoft (sessions fraîches sans record en base)
      if (isMsSession && session.provider_token && session.user) {
        await (supabase.from('connectors') as any).upsert({
          organization_id: resolvedOrgId, user_id: session.user.id, provider: 'microsoft', status: 'connected',
          metadata: { access_token: session.provider_token, refresh_token: (session as any).provider_refresh_token ?? (connected.get('microsoft')?.metadata as any)?.refresh_token ?? null, email: session.user.email, token_stored_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id,user_id,provider' });
      }
      const hasMicrosoft = connected.has('microsoft') || (isMsSession && !!session.provider_token);

      if (!hasGoogle && !hasMicrosoft) {
        setSuggestionError('Aucun compte mail connecté. Allez dans Paramètres → Connexions.');
        return;
      }

      // Tokens : session fraîche prioritaire, jamais utiliser le token MS pour Gmail
      const googleToken = hasGoogle
        ? ((connected.get('google')?.metadata as any)?.access_token ?? (isMsSession ? null : session.provider_token) ?? null)
        : null;
      const microsoftToken = hasMicrosoft
        ? ((isMsSession && session.provider_token) ? session.provider_token : ((connected.get('microsoft')?.metadata as any)?.access_token ?? null))
        : null;

      // invoke = JWT frais auto-attaché (évite les 401)
      const { data, error } = await supabase.functions.invoke('discover-contacts', {
        body: { organizationId: resolvedOrgId, googleToken, microsoftToken, lookbackDays: 3650, minExchanges: 1 },
      });
      if (error) throw new Error((error as any)?.message || 'Erreur lors de la découverte');
      setSuggestions((data as any)?.suggestions ?? []);
      setSuggestionsOpen(true);
    } catch (e: any) {
      setSuggestionError(e.message ?? 'Erreur inattendue');
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function importSuggestion(s: SuggestedContact) {
    if (!supabase || importingEmails.has(s.email)) return;
    setImportingEmails(prev => new Set(prev).add(s.email));
    try {
      const resolvedOrgId = orgId || await getActiveOrganizationId();
      const displayName = s.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const { error } = await supabase.from('contacts').insert({
        organization_id: resolvedOrgId,
        full_name: displayName,
        email: s.email,
        role_title: (s as any).title ?? null,
        linkedin_url: (s as any).linkedIn ?? null,
        source_summary: {
          source: 'mail_discovery',
          domain: s.domain,
          exchange_count: s.count,
          phone: (s as any).phone ?? null,
        },
        enrichment_status: 'pending',
      });
      if (error) throw error;
      setDismissed(prev => new Set(prev).add(s.email));
      loadContacts();

      // Auto-trigger email sync for this new contact
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: conns } = await supabase.from('connectors').select('provider, status, metadata')
          .eq('organization_id', resolvedOrgId).eq('status', 'connected');
        const connected = new Map((conns ?? []).map((c: any) => [c.provider as string, c]));
        const sessionAuthProvider = (session.user?.app_metadata as any)?.provider ?? '';
        const isMsSession = sessionAuthProvider === 'azure' || sessionAuthProvider === 'microsoft';
        if (connected.has('google')) {
          const googleToken = (connected.get('google')?.metadata as any)?.access_token ?? (isMsSession ? null : session.provider_token) ?? null;
          supabase.functions.invoke('ingest-communication', {
            body: { organizationId: resolvedOrgId, providerToken: googleToken, provider: 'google', contactEmails: [s.email], lookbackDays: 3650, maxMessagesPerContact: 1000 },
          }).catch(() => {});
        }
        if (connected.has('microsoft')) {
          const msToken: string | null = (isMsSession && session.provider_token) ? session.provider_token : ((connected.get('microsoft')?.metadata as any)?.access_token ?? null);
          supabase.functions.invoke('ingest-communication', {
            body: { organizationId: resolvedOrgId, providerToken: msToken, provider: 'microsoft', contactEmails: [s.email], lookbackDays: 3650, maxMessagesPerContact: 1000 },
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      console.error('Import error:', e.message);
    } finally {
      setImportingEmails(prev => { const n = new Set(prev); n.delete(s.email); return n; });
    }
  }

  // ── Détection des doublons par nom normalisé ──────────────────────────────
  const duplicateGroups = useMemo(() => {
    const normalize = (name: string) =>
      name.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/).filter(Boolean).sort().join(' ');

    const byNorm = new Map<string, Contact[]>();
    for (const c of contacts) {
      if (!c.name || c.name === '—') continue;
      if (c.source !== 'contact') continue; // fusion seulement entre vrais contacts (pas les participants)
      const norm = normalize(c.name);
      if (norm.length < 4) continue; // ignore noms trop courts
      if (!byNorm.has(norm)) byNorm.set(norm, []);
      byNorm.get(norm)!.push(c);
    }
    // Groupes avec emails différents (vraie collision) ET non refusés
    return Array.from(byNorm.values()).filter(
      group => group.length >= 2
        && new Set(group.map(c => c.email)).size >= 2
        && !dismissedDups.includes(dupKey(group))
    );
  }, [contacts, dismissedDups]);

  function dupKey(group: Contact[]): string {
    return group.map(c => (c.email || c.id).toLowerCase()).sort().join('|');
  }
  function dismissDuplicate(group: Contact[]) {
    const k = dupKey(group);
    setDismissedDups(prev => {
      const next = Array.from(new Set([...prev, k]));
      try { localStorage.setItem('knowr.dup.dismissed', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  async function mergeContact(primary: Contact, secondary: Contact) {
    if (!supabase || mergingIds.has(secondary.id)) return;
    setMergingIds(prev => new Set(prev).add(secondary.id));
    try {
      // 1. Ajouter l'email secondaire aux emails secondaires du contact principal
      const { data: primaryRaw } = await supabase.from('contacts').select('secondary_emails').eq('id', primary.id).maybeSingle();
      const existing: string[] = primaryRaw?.secondary_emails ?? [];
      if (secondary.email && !existing.includes(secondary.email)) {
        await supabase.from('contacts').update({
          secondary_emails: [...existing, secondary.email],
        }).eq('id', primary.id);
      }
      // 2. Transférer les communication_messages
      await supabase.from('communication_messages').update({ contact_id: primary.id }).eq('contact_id', secondary.id);
      // 3. Marquer le doublon comme fusionné
      await supabase.from('contacts').update({ merged_into_contact_id: primary.id }).eq('id', secondary.id);
      loadContacts();
    } catch (e: any) {
      console.error('Merge error:', e.message);
    } finally {
      setMergingIds(prev => { const n = new Set(prev); n.delete(secondary.id); return n; });
    }
  }

  const sorted = useMemo(() => {
    let result = [...contacts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'engagement': result.sort((a, b) => b.engagementScore - a.engagementScore); break;
      case 'risk': result.sort((a, b) => (b.lastContactDays ?? 999) - (a.lastContactDays ?? 999)); break;
      case 'deciders': result = result.filter(c => c.isDecisionMaker); break;
      case 'meetings': result.sort((a, b) => b.meetingsCount - a.meetingsCount); break;
      case 'alpha': result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [contacts, searchQuery, sortBy]);

  const companies = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, CompanyGroup>();
    for (const c of contacts) {
      if (!c.company) continue;
      if (!map.has(c.company)) {
        map.set(c.company, { name: c.company, contacts: [], meetingsTotal: 0, lastContactDays: null });
      }
      const grp = map.get(c.company)!;
      grp.contacts.push(c);
      grp.meetingsTotal += c.meetingsCount;
      if (c.lastContactDays !== null) {
        if (grp.lastContactDays === null || c.lastContactDays < grp.lastContactDays) {
          grp.lastContactDays = c.lastContactDays;
        }
      }
    }
    const filtered = Array.from(map.values()).filter(g =>
      !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => b.meetingsTotal - a.meetingsTotal);
  }, [contacts, searchQuery]);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'meetings', label: '📅 Réunions' },
    { value: 'engagement', label: '📊 Engagement' },
    { value: 'risk', label: '⏰ À risque' },
    { value: 'alpha', label: '🔤 A→Z' },
  ];

  const displayed = sorted.slice(0, displayCount);

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1600px] mx-auto px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <PageHeader
            title="Personnes"
            subtitle={
              loading ? (
                <span className="flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Chargement…</span>
              ) : (
                <span className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
                  {contacts.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{companies.size ?? companies.length} entreprise{companies.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-primary" />
                        {contacts.reduce((s, c) => s + c.meetingsCount, 0)} réunion{contacts.reduce((s, c) => s + c.meetingsCount, 0) !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </span>
              )
            }
            actions={
              <>
                <button
                  onClick={syncEmails}
                  disabled={syncing}
                  className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  <span className="hidden sm:inline">{syncing ? 'Sync…' : 'Actualiser'}</span>
                </button>
                <span className="relative">
                  <button
                    onClick={discoverContacts}
                    disabled={loadingSuggestions}
                    className="px-4 py-2 bg-card border border-border hover:bg-muted/50 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loadingSuggestions ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4 text-primary" />}
                    <span className="hidden sm:inline">{loadingSuggestions ? 'Scan en cours…' : 'Découvrir via Mail'}</span>
                    <span className="sm:hidden">{loadingSuggestions ? '…' : 'Mail'}</span>
                  </button>
                  <Coachmark
                    id="personnes-discover"
                    title="Découvrez vos contacts"
                    text="Knowr scanne vos emails pour vous proposer les personnes avec qui vous échangez le plus."
                    className="top-full right-0 mt-2"
                  />
                </span>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-primary text-white hover:bg-accent rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Ajouter un contact</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </>
            }
          />

          {syncMsg && (
            <p className={`text-xs px-3 py-1.5 rounded-full mb-2 w-fit ${syncMsg.startsWith('✓') ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {syncMsg}
            </p>
          )}

          {/* View Toggle + Search */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewType('people')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm ${
                  viewType === 'people' ? 'bg-primary text-white' : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                <Users className="size-4" /> Personnes
              </button>
              <button
                onClick={() => setViewType('companies')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm ${
                  viewType === 'companies' ? 'bg-primary text-white' : 'bg-card border border-border hover:bg-muted/50'
                }`}
              >
                <Building2 className="size-4" /> Entreprises
              </button>
            </div>

            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un contact, entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Doublons détectés ──────────────────────────────────────────── */}
        <AnimatePresence>
          {duplicateGroups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden"
            >
              <button
                onClick={() => setDuplicatesOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                    <AlertCircle className="size-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{duplicateGroups.length} doublon{duplicateGroups.length > 1 ? 's' : ''} probable{duplicateGroups.length > 1 ? 's' : ''} détecté{duplicateGroups.length > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">Même nom, emails différents — probablement la même personne</p>
                  </div>
                </div>
                {duplicatesOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </button>
              {duplicatesOpen && (
                <div className="px-5 pb-5 space-y-3">
                  {duplicateGroups.map((group, gi) => (
                    <div key={gi} className="rounded-xl border border-amber-500/15 bg-background p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                          {group[0].name} — {group.length} comptes détectés
                        </p>
                        <button
                          onClick={() => dismissDuplicate(group)}
                          title="Ce ne sont pas des doublons — ignorer définitivement"
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
                        >
                          <X className="size-3" /> Refuser
                        </button>
                      </div>
                      <div className="space-y-2">
                        {group.map((c, ci) => (
                          <div key={c.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="size-7 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                                {c.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{c.email ?? '—'}</p>
                              </div>
                            </div>
                            {ci > 0 && (
                              <button
                                onClick={() => mergeContact(group[0], c)}
                                disabled={mergingIds.has(c.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 transition-colors flex-shrink-0 disabled:opacity-40"
                              >
                                {mergingIds.has(c.id) ? <Loader2 className="size-3 animate-spin" /> : null}
                                Fusionner dans {group[0].name.split(' ')[0]}
                              </button>
                            )}
                            {ci === 0 && (
                              <span className="text-[10px] text-amber-600 font-semibold bg-amber-500/15 px-2 py-0.5 rounded-full flex-shrink-0">Principal</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Suggestions Mail ──────────────────────────────────────────── */}
        <AnimatePresence>
          {(suggestions.length > 0 || suggestionError) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden"
            >
              {/* Header du bandeau */}
              <button
                onClick={() => setSuggestionsOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <UserPlus className="size-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground">
                      {suggestions.filter(s => !dismissed.has(s.email)).length} suggestion{suggestions.filter(s => !dismissed.has(s.email)).length > 1 ? 's' : ''} détectée{suggestions.filter(s => !dismissed.has(s.email)).length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Interlocuteurs fréquents détectés dans vos emails (Gmail &amp; Outlook) — pas encore dans Knowr.</p>
                  </div>
                </div>
                {suggestionsOpen ? <ChevronUp className="size-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {suggestionError && (
                <div className="px-5 pb-4 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  {suggestionError}
                </div>
              )}

              {suggestionsOpen && !suggestionError && (
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {suggestions.filter(s => !dismissed.has(s.email)).map(s => {
                      const isImporting = importingEmails.has(s.email);
                      const initials2 = s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                      const daysSinceContact = Math.floor((Date.now() - new Date(s.lastSeen).getTime()) / 86400000);
                      const whenText = daysSinceContact === 0 ? "Auj." : daysSinceContact === 1 ? 'Hier' : daysSinceContact < 7 ? `Il y a ${daysSinceContact}j` : daysSinceContact < 30 ? `Il y a ${Math.floor(daysSinceContact / 7)} sem.` : `Il y a ${Math.floor(daysSinceContact / 30)} mois`;

                      return (
                        <div key={s.email} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                          {/* Avatar */}
                          <div className="size-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {initials2}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {s.count} échange{s.count > 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{whenText}</span>
                            </div>
                            {s.lastSubject && (
                              <p className="text-[11px] text-foreground/70 font-medium truncate mt-1.5">
                                ✉ {s.lastSubject}
                              </p>
                            )}
                            {s.lastSnippet && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                {s.lastSnippet}
                              </p>
                            )}
                          </div>
                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => importSuggestion(s)}
                              disabled={isImporting}
                              title="Importer ce contact"
                              className="size-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
                            >
                              {isImporting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                            </button>
                            <button
                              onClick={() => setDismissed(prev => new Set(prev).add(s.email))}
                              title="Ignorer"
                              className="size-7 rounded-lg border border-border text-muted-foreground flex items-center justify-center hover:border-destructive hover:text-destructive transition-colors"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {suggestions.filter(s => !dismissed.has(s.email)).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Toutes les suggestions ont été traitées.</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-8 text-primary animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="size-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6">
              <Users className="size-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Aucun contact pour le moment</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Vos contacts apparaîtront automatiquement après la synchronisation de votre Google Calendar.
              Chaque participant à vos réunions externes sera importé.
            </p>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm text-left">
              <p className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                Comment importer vos contacts
              </p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Allez dans <strong>Réunions</strong></li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Cliquez <strong>"Sync Google Calendar"</strong></li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Vos contacts arrivent automatiquement</li>
              </ol>
            </div>
          </motion.div>
        ) : viewType === 'people' ? (
          <>
            {/* Sort */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 flex flex-wrap items-center gap-3"
            >
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tri :</span>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                    sortBy === opt.value ? 'bg-primary text-white' : 'bg-card border border-border hover:bg-muted/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="overflow-x-auto rounded-2xl border border-border bg-card"
            >
              <div className="grid min-w-[760px] grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b border-border">
                <div className="col-span-3" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Contact</div>
                <div className="col-span-3" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Entreprise</div>
                <div className="col-span-2 text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Emails</div>
                <div className="col-span-2 text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Score</div>
                <div className="col-span-1 text-center" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--t3, #9082B8)' }}>Vu</div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y divide-border">
                {displayed.map((contact, i) => {
                  const scoreColorVal = contact.engagementScore >= 70 ? '#2EA86A' : contact.engagementScore >= 50 ? '#C97A20' : contact.engagementScore > 0 ? '#D94F63' : 'var(--t4, #C4B8E0)';
                  return (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.015 }}
                    className="grid min-w-[760px] grid-cols-12 gap-4 px-6 py-4 transition-all cursor-pointer group items-center"
                    style={{ borderLeft: `3px solid ${scoreColorVal}`, paddingLeft: '21px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(110,80,200,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(110,80,200,0.03)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.background = ''; }}
                    onClick={() => navigate(`/contact/${contact.id}`)}
                  >
                    {/* Contact */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {contact.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm truncate">{contact.name}</p>
                          {contact.isDecisionMaker && (
                            <Star className="size-3 text-primary fill-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.role || contact.email || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="col-span-3 flex items-center gap-2">
                      {contact.company ? (
                        <>
                          <div className="size-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                            {contact.company[0].toUpperCase()}
                          </div>
                          <p className="text-sm truncate">{contact.company}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>

                    {/* Emails */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <Mail className="size-3 text-muted-foreground" />
                      <span className={`text-sm font-medium ${contact.emailCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {contact.emailCount}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 flex items-center justify-center">
                      {contact.engagementScore > 0 ? (
                        <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: '15px', color: scoreColorVal }}>
                          {contact.engagementScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Last contact */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', fontWeight: 600,
                        color: contact.lastContactDays === null ? 'var(--t3, #9082B8)' :
                        contact.lastContactDays > 14 ? '#D94F63' :
                        contact.lastContactDays > 7 ? '#C97A20' :
                        '#2EA86A'
                      }}>
                        {getDaysText(contact.lastContactDays)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {displayCount < sorted.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setDisplayCount(d => d + 50)}
                  className="px-6 py-3 bg-card hover:bg-muted/50 border border-border rounded-xl transition-colors flex items-center gap-2 mx-auto text-sm"
                >
                  <ChevronDown className="size-4" />
                  Charger 50 de plus ({sorted.length - displayCount} restants)
                </button>
              </div>
            )}
          </>
        ) : (
          /* Companies view */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div className="col-span-4">Entreprise</div>
              <div className="col-span-3 text-center">Contacts</div>
              <div className="col-span-2 text-center">Réunions</div>
              <div className="col-span-2 text-center">Dernier contact</div>
              <div className="col-span-1" />
            </div>

            <div className="divide-y divide-border">
              {companies.map((grp, i) => (
                <motion.div
                  key={grp.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group items-center"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-base font-bold flex-shrink-0">
                      {grp.name[0].toUpperCase()}
                    </div>
                    <p className="font-semibold">{grp.name}</p>
                  </div>

                  <div className="col-span-3 flex items-center justify-center gap-1">
                    <Users className="size-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{grp.contacts.length}</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{grp.meetingsTotal}</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`text-sm font-medium ${
                      grp.lastContactDays === null ? 'text-muted-foreground' :
                      grp.lastContactDays > 14 ? 'text-destructive' :
                      grp.lastContactDays > 7 ? 'text-warning' :
                      'text-success'
                    }`}>
                      {getDaysText(grp.lastContactDays)}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-end">
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && orgId && (
          <AddContactModal
            orgId={orgId}
            onClose={() => setShowAddModal(false)}
            onAdded={() => { loadContacts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
