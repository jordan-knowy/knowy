import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Clock,
  FileText,
  Target,
  Zap,
  Apple,
  Monitor,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import KnowyCard from './knowy/KnowyCard';
import KnowyButton from './knowy/KnowyButton';
import KnowyBadge from './knowy/KnowyBadge';

export default function Coaching() {
  const [selectedOS, setSelectedOS] = useState<'mac' | 'windows'>('mac');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');

  // Auto-detect OS
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) {
      setSelectedOS('windows');
    } else if (userAgent.includes('mac')) {
      setSelectedOS('mac');
    }
  }, []);

  const features = [
    {
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      title: 'Équilibre de participation',
      description: 'L\'IA observe et encourage une distribution équitable de la parole, en priorisant ceux qui n\'ont pas encore contribué.',
      capabilities: [
        'Détection automatique des demandes de parole',
        'Suggestions pour donner la parole aux moins actifs',
        'Métriques de participation en temps réel'
      ]
    },
    {
      icon: Clock,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      title: 'Gestion du temps',
      description: 'L\'IA suit l\'ordre du jour et veille au respect des temps impartis pour chaque séquence.',
      capabilities: [
        'Alertes automatiques sur le temps restant',
        'Suggestions de recentrage si débordement',
        'Adaptation dynamique de l\'agenda'
      ]
    },
    {
      icon: FileText,
      color: 'text-success',
      bgColor: 'bg-success/10',
      title: 'Synthèse intelligente',
      description: 'L\'IA capture les décisions, actions et points clés sans faire de transcription mot-à-mot.',
      capabilities: [
        'Identification automatique des décisions',
        'Extraction des actions et responsables',
        'Résumé structuré post-réunion'
      ]
    },
    {
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-600/10',
      title: 'Garde du focus',
      description: 'L\'IA détecte les digressions et aide à recentrer la discussion sur les objectifs de la réunion.',
      capabilities: [
        'Détection des sujets hors agenda',
        'Suggestions de recentrage diplomatiques',
        'Parking pour les sujets à traiter ultérieurement'
      ]
    }
  ];

  const handleDownload = () => {
    // Simulate download
    console.log(`Downloading plugin for ${selectedOS}`);
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-2">Coaching en temps réel</h1>
          <p className="text-muted-foreground mb-8">
            Optimisez vos réunions avec votre assistant IA qui vous accompagne pendant vos échanges.
          </p>
        </motion.div>

        {/* Layout: Content 80% + Plugin Mockup 20% */}
        <div className="grid grid-cols-[80%_20%] gap-6 mb-8">
          {/* LEFT - Content */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Download Plugin */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <KnowyCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Download className="size-6 text-primary" />
                <h2 className="text-xl font-semibold">Plugin Knowy Coaching</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Téléchargez et installez le plugin pour activer le coaching IA pendant vos réunions Zoom, Google Meet et Microsoft Teams.
              </p>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setSelectedOS('mac')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedOS === 'mac'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Apple className="size-5" />
                  <span className="font-medium">macOS</span>
                </button>
                <button
                  onClick={() => setSelectedOS('windows')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedOS === 'windows'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Monitor className="size-5" />
                  <span className="font-medium">Windows</span>
                </button>
              </div>

              <KnowyButton onClick={handleDownload} className="w-full">
                <Download className="size-4" />
                Télécharger pour {selectedOS === 'mac' ? 'macOS' : 'Windows'}
              </KnowyButton>

              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Configuration requise:</strong> macOS 11+ ou Windows 10+,
                  Zoom 5.0+, Google Meet (navigateur Chrome), Microsoft Teams (app desktop)
                </p>
              </div>
            </KnowyCard>
          </motion.div>

          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <KnowyCard className="p-6">
              <h3 className="font-semibold mb-4">Statut</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Connexion</span>
                    {connectionStatus === 'connected' && (
                      <KnowyBadge variant="sage" className="gap-1">
                        <Wifi className="size-3" />
                        Connecté
                      </KnowyBadge>
                    )}
                    {connectionStatus === 'disconnected' && (
                      <KnowyBadge variant="coral" className="gap-1">
                        <WifiOff className="size-3" />
                        Déconnecté
                      </KnowyBadge>
                    )}
                    {connectionStatus === 'syncing' && (
                      <KnowyBadge variant="amber" className="gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        Synchro...
                      </KnowyBadge>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle2 className="size-4 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Plugin installé</p>
                      <p className="text-xs text-muted-foreground">Version 1.2.4</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle2 className="size-4 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Calendrier synchronisé</p>
                      <p className="text-xs text-muted-foreground">Dernière synchro: il y a 2 min</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Zoom connecté</p>
                      <p className="text-xs text-muted-foreground">Prêt pour les réunions</p>
                    </div>
                  </div>
                </div>
              </div>
            </KnowyCard>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-6">Capacités de votre coach IA</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <KnowyCard key={index} className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`size-12 ${feature.bgColor} rounded-xl flex items-center justify-center`}>
                    <feature.icon className={`size-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {feature.capabilities.map((capability, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </KnowyCard>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8"
        >
          <KnowyCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              Comment ça fonctionne ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Rejoignez votre réunion</p>
                  <p className="text-sm text-muted-foreground">Le plugin détecte automatiquement le début de votre réunion</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">L'IA vous assiste</p>
                  <p className="text-sm text-muted-foreground">Suggestions en temps réel visibles uniquement par vous</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Synthèse automatique</p>
                  <p className="text-sm text-muted-foreground">Compte-rendu et enrichissement relationnel post-réunion</p>
                </div>
              </div>
            </div>
          </KnowyCard>
        </motion.div>
          </div>

          {/* RIGHT - Plugin Mockup (20%) */}
          <div className="sticky top-8 self-start">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Plugin Header */}
                <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Knowy Coach</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-success font-medium">Active</span>
                  </div>
                </div>

                {/* Plugin Content */}
                <div className="p-3 space-y-3 bg-gradient-to-b from-card to-muted/20" style={{ height: '600px' }}>
                  {/* Suggestion 1 - Équilibre parole */}
                  <div className="bg-amber-600/10 border border-amber-600/20 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Users className="size-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-600 mb-1">Équilibre de parole</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Marc n'a pas parlé depuis 8 min. Sollicitez son avis.
                        </p>
                      </div>
                    </div>
                    <button className="w-full text-[10px] bg-amber-600 text-white py-1.5 rounded-md font-medium hover:bg-amber-700 transition-colors">
                      Voir suggestion
                    </button>
                  </div>

                  {/* Suggestion 2 - Temps */}
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Clock className="size-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-primary mb-1">Gestion du temps</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          8 min restantes. Prévoir temps pour Q&A.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion 3 - Décision */}
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-success flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-success mb-1">Décision captée</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          "Pilote 30j validé - démarrage 15 juin"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Suggestion 4 - Focus */}
                  <div className="bg-muted/50 border border-border rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Target className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold mb-1">Garde du focus</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Conversation alignée avec l'agenda
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live Insights */}
                  <div className="border-t border-border pt-3 mt-4">
                    <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Insights temps réel</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Sarah</span>
                        <span className="font-mono font-bold">42%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Marc</span>
                        <span className="font-mono font-bold">31%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Vous</span>
                        <span className="font-mono font-bold">27%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plugin Footer */}
                <div className="bg-muted/30 border-t border-border p-2 text-center">
                  <p className="text-[9px] text-muted-foreground">Visible uniquement par vous</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3 italic">
                ↑ Aperçu de l'interface pendant vos réunions
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
