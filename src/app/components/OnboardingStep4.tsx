import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { AlertCircle, Bell, Mail, Smartphone, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import KnowrButton from './knowr/KnowrButton';
import { supabase } from '../../lib/supabase';
import { requireOnboardingContext, updateOnboardingContext } from '../../lib/onboarding';

export default function OnboardingStep4() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification timing
  const [briefTiming, setBriefTiming] = useState('2h');
  const [dailyDigest, setDailyDigest] = useState(true);
  const [dailyDigestTime, setDailyDigestTime] = useState('08:00');

  // Notification channels
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [slackNotifs, setSlackNotifs] = useState(false);

  // Notification types
  const [briefReady, setBriefReady] = useState(true);
  const [meetingReminder, setMeetingReminder] = useState(true);
  const [dealAlerts, setDealAlerts] = useState(true);
  const [weeklyInsights, setWeeklyInsights] = useState(true);

  useEffect(() => {
    requireOnboardingContext()
      .then(({ user, organizationId }) => {
        setUserId(user.id);
        setOrganizationId(organizationId);
      })
      .catch(() => navigate('/signin', { replace: true }));
  }, [navigate]);

  const timingToMinutes: Record<string, number> = {
    '24h': 1440,
    '12h': 720,
    '6h': 360,
    '2h': 120,
    '1h': 60,
  };

  const handleContinue = async () => {
    if (!supabase || !userId || !organizationId) return;

    setSaving(true);
    setError(null);
    const client = supabase as any;

    const { error: notifError } = await client.from('notification_preferences').upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        brief_timing_minutes: timingToMinutes[briefTiming] ?? 120,
        email_enabled: emailNotifs,
        push_enabled: pushNotifs,
        daily_digest_enabled: dailyDigest,
        daily_digest_time: dailyDigestTime,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' }
    );

    const { error: privacyError } = await client.from('privacy_settings').upsert(
      {
        organization_id: organizationId,
        user_id: userId,
        analyze_email: briefReady || dealAlerts || weeklyInsights,
        analyze_calendar: meetingReminder || briefReady,
        analyze_transcripts: false,
        share_with_team: false,
        retention_days: 365,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' }
    );

    if (notifError || privacyError) {
      setError(notifError?.message ?? privacyError?.message ?? 'Préférences impossibles à sauvegarder.');
      setSaving(false);
      return;
    }

    await updateOnboardingContext(organizationId, userId, {
      current_step: 5,
      step4: true,
      notification_types: {
        brief_ready: briefReady,
        meeting_reminder: meetingReminder,
        deal_alerts: dealAlerts,
        weekly_insights: weeklyInsights,
        slack_enabled: slackNotifs,
      },
    });

    navigate('/onboarding/step5');
  };

  const timingOptions = [
    { value: '24h', label: '24h avant', desc: 'Préparation très en avance' },
    { value: '12h', label: '12h avant', desc: 'Préparation anticipée' },
    { value: '6h', label: '6h avant', desc: 'Préparation matinale' },
    { value: '2h', label: '2h avant', desc: 'Recommandé - Juste à temps', recommended: true },
    { value: '1h', label: '1h avant', desc: 'Last minute' }
  ];

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Étape 3 sur 4</span>
            <span className="text-sm font-medium text-primary">75%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: '75%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-primary rounded-full h-2"
            />
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center size-16 bg-primary/10 rounded-2xl mb-6">
            <Bell className="size-8 text-primary" />
          </div>
          <h1 className="mb-4">Configurez vos notifications</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recevez vos briefs au bon moment, sur les bons canaux.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Brief Timing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="size-6 text-primary" />
              <div>
                <h3 className="mb-1">Timing des briefs de réunion</h3>
                <p className="text-sm text-muted-foreground">
                  Quand voulez-vous recevoir vos briefs avant chaque meeting ?
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {timingOptions.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    briefTiming === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="briefTiming"
                    value={option.value}
                    checked={briefTiming === option.value}
                    onChange={(e) => setBriefTiming(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    briefTiming === option.value ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {briefTiming === option.value && (
                      <div className="size-2.5 bg-primary rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.label}</span>
                      {option.recommended && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Daily Digest */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="size-6 text-primary" />
                <div>
                  <h3>Digest quotidien</h3>
                  <p className="text-sm text-muted-foreground">
                    Résumé de votre journée et briefs du jour
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {dailyDigest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 ml-9"
              >
                <label className="text-sm text-muted-foreground">Heure d'envoi:</label>
                <input
                  type="time"
                  value={dailyDigestTime}
                  onChange={(e) => setDailyDigestTime(e.target.value)}
                  className="px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Notification Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="mb-4">Canaux de notification</h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">Briefs, alertes, résumés</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="size-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-primary" />
                  <div>
                    <p className="font-medium">Push (navigateur/mobile)</p>
                    <p className="text-sm text-muted-foreground">Briefs prêts, rappels meeting</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="size-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          </motion.div>

          {/* Notification Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="mb-4">Types de notifications</h3>

            <div className="space-y-3">
              {[
                { id: 'briefReady', label: 'Brief prêt', desc: 'Quand un brief de réunion est généré', checked: briefReady, setter: setBriefReady },
                { id: 'meetingReminder', label: 'Rappel meeting', desc: '15 min avant chaque réunion', checked: meetingReminder, setter: setMeetingReminder },
                { id: 'dealAlerts', label: 'Alertes deals', desc: 'Deals à risque, actions critiques', checked: dealAlerts, setter: setDealAlerts },
                { id: 'weeklyInsights', label: 'Insights hebdo', desc: 'Résumé et insights de la semaine', checked: weeklyInsights, setter: setWeeklyInsights }
              ].map((notif) => (
                <label
                  key={notif.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-sm">{notif.label}</p>
                    <p className="text-xs text-muted-foreground">{notif.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notif.checked}
                    onChange={(e) => notif.setter(e.target.checked)}
                    className="size-4 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              ))}
            </div>
          </motion.div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive mt-8">
            <AlertCircle className="size-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-between mt-8"
        >
          <button
            onClick={() => navigate('/onboarding/step2')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour
          </button>

          <KnowrButton
            variant="primary"
            size="lg"
            onClick={handleContinue}
            loading={saving}
            disabled={saving}
          >
            Continuer
          </KnowrButton>
        </motion.div>
      </div>
    </div>
  );
}
