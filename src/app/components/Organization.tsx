import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Network,
  Mail,
  UserPlus,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react';
import { useCurrentProfile } from '../../hooks/useCurrentProfile';
import { supabase } from '../../lib/supabase';
import { getActiveOrganizationId } from '../../lib/api/org';

interface TeamMember {
  name: string;
  role: string;
  photo: string;
  department: string;
  seniority: string;
  meetingsThisWeek: number;
  accountsManaged: number;
  activityScore: number;
}

interface Alert {
  type: 'warning' | 'info' | 'critical';
  message: string;
  meeting?: string;
  recommendation?: string;
}

export default function Organization() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [licenceTotal, setLicenceTotal] = useState(0);
  const { profile } = useCurrentProfile();

  const orgName = profile?.companyName && profile.companyName !== 'Workspace Tohu'
    ? profile.companyName
    : 'Mon Organisation';

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      if (!supabase) {
        setLoadingTeam(false);
        return;
      }

      const orgId = await getActiveOrganizationId();
      if (!orgId) {
        setLoadingTeam(false);
        return;
      }

      const { data: memberships } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('organization_id', orgId);

      if (!memberships?.length) {
        setLoadingTeam(false);
        return;
      }

      const userIds = memberships.map((m: any) => m.user_id);
      setLicenceTotal(userIds.length);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role_title, avatar_url')
        .in('id', userIds);

      if (mounted && profiles?.length) {
        setTeamMembers(
          profiles.map((p: any) => ({
            name: p.full_name ?? 'Membre',
            role: p.role_title ?? 'Collaborateur',
            photo: '👤',
            department: 'Équipe',
            seniority: '',
            meetingsThisWeek: 0,
            accountsManaged: 0,
            activityScore: 0,
          }))
        );
      }

      if (mounted) setLoadingTeam(false);
    }

    loadTeam();
    return () => { mounted = false; };
  }, []);

  const alerts: Alert[] = [];
  const insights: string[] = [];

  const handleInvite = () => {
    if (inviteEmail) {
      console.log('Inviting:', inviteEmail);
      setInviteEmail('');
    }
  };

  const departmentColors: Record<string, string> = {
    'Sales': 'bg-primary/10 text-primary border-primary/20',
    'Customer Success': 'bg-success/10 text-success border-success/20',
    'Operations': 'bg-accent/10 text-accent border-accent/20',
    'Leadership': 'bg-secondary/10 text-secondary border-secondary/20'
  };

  const alertColors: Record<string, { bg: string; border: string; icon: string }> = {
    'critical': { bg: 'bg-destructive/5', border: 'border-destructive/20', icon: 'text-destructive' },
    'warning': { bg: 'bg-warning/5', border: 'border-warning/20', icon: 'text-warning' },
    'info': { bg: 'bg-primary/5', border: 'border-primary/20', icon: 'text-primary' }
  };

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
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="size-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-3xl">
                🎯
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{orgName}</h1>
                <p className="text-muted-foreground">Cockpit relationnel organisationnel</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl transition-colors flex items-center gap-2">
                <Calendar className="size-4" />
                <span>Calendrier global</span>
              </button>
              <button className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-xl transition-colors flex items-center gap-2">
                <Network className="size-4" />
                <span>Connecter CRM</span>
              </button>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-2">
                <Users className="size-5 text-primary" />
                <span className="text-3xl font-semibold">{licenceTotal > 0 ? licenceTotal : '—'}</span>
              </div>
              <p className="text-sm text-muted-foreground">Membres actifs</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="size-5 text-accent" />
                <span className="text-3xl font-semibold">101</span>
              </div>
              <p className="text-sm text-muted-foreground">Réunions cette semaine</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="size-5 text-success" />
                <span className="text-3xl font-semibold">89%</span>
              </div>
              <p className="text-sm text-muted-foreground">Score relationnel org</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-2">
                <Target className="size-5 text-secondary" />
                <span className="text-3xl font-semibold">76%</span>
              </div>
              <p className="text-sm text-muted-foreground">Couverture relationnelle</p>
            </div>
          </div>
        </motion.div>

        {/* Alerts section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Meeting Prioritization & Alerts</h2>
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center md:p-8">
              <AlertTriangle className="mx-auto mb-3 size-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aucune alerte pour le moment — les alertes apparaîtront dès que Tohu détecte des risques relationnels sur vos réunions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border ${alertColors[alert.type].bg} ${alertColors[alert.type].border}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`size-5 flex-shrink-0 mt-0.5 ${alertColors[alert.type].icon}`} />
                    <div className="flex-1">
                      <p className="font-semibold mb-2">{alert.message}</p>
                      {alert.meeting && (
                        <p className="text-sm text-muted-foreground mb-2">📅 {alert.meeting}</p>
                      )}
                      {alert.recommendation && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-sm flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <span className="font-medium">Recommandation:</span> {alert.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Team Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Team Overview</h2>
            <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-accent transition-colors flex items-center gap-2">
              <UserPlus className="size-4" />
              Inviter un membre
            </button>
          </div>

          {loadingTeam && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <span className="text-sm">Chargement de l'équipe…</span>
            </div>
          )}

          {!loadingTeam && teamMembers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
              <Users className="mx-auto mb-3 size-8 text-muted-foreground/50" />
              <p className="font-semibold text-muted-foreground">Aucun membre encore</p>
              <p className="mt-1 text-sm text-muted-foreground">Invitez vos collègues pour voir leur activité ici.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{member.photo}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1 truncate">{member.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${departmentColors[member.department]}`}>
                        {member.department}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                        {member.seniority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-semibold">{member.meetingsThisWeek}</p>
                    <p className="text-xs text-muted-foreground">Réunions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">{member.accountsManaged}</p>
                    <p className="text-xs text-muted-foreground">Comptes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-primary">{member.activityScore}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>

                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${member.activityScore}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Organizational Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            Organizational Insights
          </h2>

          {insights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-5 text-center md:p-8">
              <Sparkles className="mx-auto mb-3 size-7 text-primary/40" />
              <p className="text-sm text-muted-foreground">Les insights organisationnels apparaîtront dès que votre équipe aura connecté ses calendriers et réunions.</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/10 md:p-8">
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border"
                  >
                    <div className="size-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="flex-1">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Team Activity & Coverage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Team Activity & Coverage</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Réunions par équipe</h3>
                <BarChart3 className="size-5 text-primary" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Sales</span>
                    <span className="text-sm font-medium">48</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Customer Success</span>
                    <span className="text-sm font-medium">41</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-success rounded-full h-2 w-[72%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Operations</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-accent rounded-full h-2 w-[21%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Couverture relationnelle</h3>
                <Target className="size-5 text-success" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">C-Level</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-success rounded-full h-2 w-[68%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">VP Level</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-success rounded-full h-2 w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Manager</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div className="bg-success rounded-full h-2 w-[92%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Répartition comptes</h3>
                <Building2 className="size-5 text-accent" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comptes stratégiques</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Comptes actifs</span>
                  <span className="font-semibold">48</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg par personne</span>
                  <span className="font-semibold">3.2</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invite Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <div className="bg-card rounded-2xl p-5 border border-border md:p-8">
            <h2 className="text-2xl font-bold mb-6">Inviter des membres de l'équipe</h2>

            <div className="flex gap-3 mb-6">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="flex-1 px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="px-6 py-3 bg-primary hover:bg-accent text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Mail className="size-4" />
                Envoyer invitation
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-semibold mb-1">3</p>
                <p className="text-sm text-muted-foreground">Invitations en attente</p>
              </div>
              <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                <p className="text-2xl font-semibold text-success mb-1">15</p>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-semibold mb-1">5</p>
                <p className="text-sm text-muted-foreground">Licences disponibles</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
