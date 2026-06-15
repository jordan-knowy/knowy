import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
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
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface SuggestedContact {
  email: string;
  name: string;
  domain: string;
  count: number;
  lastSeen: string;
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

  useEffect(() => {
    loadContacts();
  }, []);

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

  async function discoverContacts() {
    if (!supabase || loadingSuggestions) return;
    setLoadingSuggestions(true);
    setSuggestionError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');
      const resolvedOrgId = orgId || await getActiveOrganizationId();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/discover-contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: resolvedOrgId,
          providerToken: session.provider_token,
          lookbackDays: 90,
          minExchanges: 2,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la découverte');
      setSuggestions(data.suggestions ?? []);
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
        source_summary: { source: 'gmail_discovery', domain: s.domain, exchange_count: s.count },
        enrichment_status: 'pending',
      });
      if (error) throw error;
      setDismissed(prev => new Set(prev).add(s.email));
      loadContacts();
    } catch (e: any) {
      console.error('Import error:', e.message);
    } finally {
      setImportingEmails(prev => { const n = new Set(prev); n.delete(s.email); return n; });
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
                  onClick={loadContacts}
                  className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl flex items-center gap-2 text-sm transition-colors"
                >
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
                <button
                  onClick={discoverContacts}
                  disabled={loadingSuggestions}
                  className="px-4 py-2 bg-card border border-border hover:bg-muted/50 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingSuggestions ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4 text-primary" />}
                  <span className="hidden sm:inline">{loadingSuggestions ? 'Scan en cours…' : 'Découvrir via Gmail'}</span>
                  <span className="sm:hidden">{loadingSuggestions ? '…' : 'Gmail'}</span>
                </button>
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

        {/* ── Suggestions Gmail ──────────────────────────────────────────── */}
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
                      {suggestions.filter(s => !dismissed.has(s.email)).length} suggestion{suggestions.filter(s => !dismissed.has(s.email)).length > 1 ? 's' : ''} détectée{suggestions.filter(s => !dismissed.has(s.email)).length > 1 ? 's' : ''} dans Gmail
                    </p>
                    <p className="text-xs text-muted-foreground">Ces interlocuteurs échangent régulièrement avec vous mais ne sont pas encore dans Knowr.</p>
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
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {s.count} échange{s.count > 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{whenText}</span>
                            </div>
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
              <div className="grid min-w-[760px] grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="col-span-3">Contact</div>
                <div className="col-span-3">Entreprise</div>
                <div className="col-span-2 text-center">Emails</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-1 text-center">Dernier contact</div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y divide-border">
                {displayed.map((contact, i) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.015 }}
                    className="grid min-w-[760px] grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group items-center"
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
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                          contact.engagementScore >= 70 ? 'bg-success/10 text-success' :
                          contact.engagementScore >= 40 ? 'bg-primary/10 text-primary' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {contact.engagementScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Last contact */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className={`text-xs font-medium ${
                        contact.lastContactDays === null ? 'text-muted-foreground' :
                        contact.lastContactDays > 14 ? 'text-destructive' :
                        contact.lastContactDays > 7 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {getDaysText(contact.lastContactDays)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
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
