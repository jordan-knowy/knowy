import { motion } from 'motion/react';
import { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Shield,
  Target,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  TrendingUp
} from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  photo: string;
  email: string;
  department: string;
  isAdmin: boolean;
  disc: {
    profile: string;
    dominant: string;
    secondary: string;
    description: string;
  };
  discShared: boolean;
}

export default function Team() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const currentUser = {
    disc: {
      profile: 'D/I',
      dominant: 'Dominant',
      secondary: 'Influent',
      description: 'Direct, orienté résultats, aime l\'action et les challenges'
    }
  };

  const teamMembers: TeamMember[] = [
    {
      name: 'Sophie Martin',
      role: 'Enterprise AE',
      photo: '👩‍💼',
      email: 'sophie.martin@knowy.ai',
      department: 'Sales',
      isAdmin: false,
      disc: {
        profile: 'I/S',
        dominant: 'Influent',
        secondary: 'Stable',
        description: 'Enthousiaste, collaborative, valorise les relations'
      },
      discShared: true
    },
    {
      name: 'Thomas Bernard',
      role: 'Account Executive',
      photo: '👨',
      email: 'thomas.bernard@knowy.ai',
      department: 'Sales',
      isAdmin: false,
      disc: {
        profile: 'C/D',
        dominant: 'Consciencieux',
        secondary: 'Dominant',
        description: 'Analytique, précis, orienté qualité et détails'
      },
      discShared: true
    },
    {
      name: 'Julie Petit',
      role: 'Customer Success Manager',
      photo: '👩',
      email: 'julie.petit@knowy.ai',
      department: 'Customer Success',
      isAdmin: false,
      disc: {
        profile: 'S/C',
        dominant: 'Stable',
        secondary: 'Consciencieux',
        description: 'Patiente, méthodique, fiable et supportive'
      },
      discShared: true
    },
    {
      name: 'Alexandre Roy',
      role: 'CSM',
      photo: '👨‍💻',
      email: 'alexandre.roy@knowy.ai',
      department: 'Customer Success',
      isAdmin: false,
      disc: {
        profile: 'S/I',
        dominant: 'Stable',
        secondary: 'Influent',
        description: 'Empathique, à l\'écoute, team player'
      },
      discShared: false
    },
    {
      name: 'Marie Dubois',
      role: 'Operations Manager',
      photo: '👩‍💼',
      email: 'marie.dubois@knowy.ai',
      department: 'Operations',
      isAdmin: true,
      disc: {
        profile: 'C/S',
        dominant: 'Consciencieux',
        secondary: 'Stable',
        description: 'Rigoureuse, organisée, processus-oriented'
      },
      discShared: true
    }
  ];

  const departmentColors: Record<string, string> = {
    'Sales': 'bg-primary/10 text-primary border-primary/20',
    'Customer Success': 'bg-success/10 text-success border-success/20',
    'Operations': 'bg-accent/10 text-accent border-accent/20'
  };

  const getCompatibilityAnalysis = (userDisc: string, memberDisc: string) => {
    const analyses: Record<string, any> = {
      'D/I-I/S': {
        compatibility: 85,
        strengths: [
          'Vous partagez tous deux l\'enthousiasme et l\'énergie',
          'Complémentarité : votre focus résultats + son approche relationnelle',
          'Communication naturellement fluide'
        ],
        risks: [
          'Risque de manquer de structure et de suivi détaillé',
          'Potentiel conflit si décisions trop rapides vs besoin consensus'
        ],
        recommendations: [
          'Donnez-lui du temps pour consulter l\'équipe avant décisions',
          'Valorisez ses contributions relationnelles autant que les résultats',
          'Établissez des check-ins réguliers pour maintenir l\'alignement'
        ]
      },
      'D/I-C/D': {
        compatibility: 65,
        strengths: [
          'Respect mutuel de la compétence',
          'Vous partagez le goût du challenge',
          'Complémentarité stratégie (vous) + exécution précise (lui)'
        ],
        risks: [
          'Friction possible : votre rapidité vs son besoin d\'analyse',
          'Style de communication très différent (direct vs factuel)',
          'Risque d\'impatience de votre côté'
        ],
        recommendations: [
          'Donnez-lui les données et le temps d\'analyser avant de trancher',
          'Soyez explicite sur le "pourquoi" de vos décisions',
          'Utilisez des emails structurés plutôt que des calls informels'
        ]
      },
      'D/I-S/C': {
        compatibility: 70,
        strengths: [
          'Elle apporte la stabilité à votre dynamisme',
          'Excellente pour exécuter vos idées de façon méthodique',
          'Complémentarité vision (vous) + fiabilité (elle)'
        ],
        risks: [
          'Votre rythme peut la stresser',
          'Résistance potentielle aux changements brusques',
          'Communication : besoin de beaucoup plus de contexte'
        ],
        recommendations: [
          'Préparez-la aux changements avec anticipation',
          'Reconnaissez publiquement sa fiabilité et qualité de travail',
          'Soyez patient avec son besoin de process et clarté'
        ]
      },
      'D/I-S/I': {
        compatibility: 78,
        strengths: [
          'Bonne synergie relationnelle',
          'Il/elle appréciera votre leadership',
          'Atmosphère de travail positive'
        ],
        risks: [
          'Peut éviter le conflit même quand nécessaire',
          'Risque de suivre sans challenger vos idées',
          'Manque potentiel de structure'
        ],
        recommendations: [
          'Encouragez activement son feedback et ses préoccupations',
          'Créez un environnement safe pour exprimer le désaccord',
          'Compensez ensemble sur l\'organisation et le suivi'
        ]
      },
      'D/I-C/S': {
        compatibility: 72,
        strengths: [
          'Excellent pour la qualité et la conformité',
          'Complémentarité totale : vision + rigueur',
          'Fiabilité exceptionnelle'
        ],
        risks: [
          'Paralysie possible face à votre rythme',
          'Styles de décision opposés',
          'Communication très différente'
        ],
        recommendations: [
          'Donnez des directives claires avec délais réalistes',
          'Évitez les surprises et changements de dernière minute',
          'Utilisez des briefs écrits détaillés'
        ]
      }
    };

    const key = `${userDisc}-${memberDisc}`;
    return analyses[key] || {
      compatibility: 75,
      strengths: ['Profils complémentaires', 'Diversité d\'approches'],
      risks: ['Styles de communication différents'],
      recommendations: ['Communiquez ouvertement sur vos préférences de travail']
    };
  };

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-5 md:px-8 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Team</h1>
              <p className="text-muted-foreground">
                {teamMembers.length} membres dans votre équipe
              </p>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-accent transition-colors flex items-center gap-2">
              <Plus className="size-4" />
              Inviter un membre
            </button>
          </div>
        </motion.div>

        {selectedMember ? (
          /* DISC Comparison View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="mb-6 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Retour à l'équipe
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Your Profile */}
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                <h3 className="text-lg font-bold mb-4">Votre profil</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">👨‍💼</div>
                  <div>
                    <p className="font-semibold">Maxime Durant</p>
                    <p className="text-sm text-muted-foreground">VP of Sales</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-5 text-primary" />
                    <span className="font-semibold">{currentUser.disc.profile}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{currentUser.disc.dominant}</span>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{currentUser.disc.secondary}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentUser.disc.description}</p>
                </div>
              </div>

              {/* Their Profile */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-bold mb-4">Profil de {selectedMember.name.split(' ')[0]}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{selectedMember.photo}</div>
                  <div>
                    <p className="font-semibold">{selectedMember.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.role}</p>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-5 text-accent" />
                    <span className="font-semibold">{selectedMember.disc.profile}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">{selectedMember.disc.dominant}</span>
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">{selectedMember.disc.secondary}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedMember.disc.description}</p>
                </div>
              </div>
            </div>

            {(() => {
              const analysis = getCompatibilityAnalysis(currentUser.disc.profile, selectedMember.disc.profile);
              return (
                <>
                  {/* Compatibility Score */}
                  <div className="bg-gradient-to-br from-success/5 to-primary/5 rounded-2xl p-5 border border-success/20 mb-6 md:p-8">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center size-24 bg-success/20 rounded-full mb-4">
                        <span className="text-4xl font-bold text-success">{analysis.compatibility}%</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Compatibilité Relationnelle</h3>
                      <p className="text-muted-foreground">
                        {analysis.compatibility >= 80 ? 'Excellente synergie' :
                         analysis.compatibility >= 70 ? 'Bonne complémentarité' :
                         'Complémentarité avec attention'}
                      </p>
                    </div>
                  </div>

                  {/* Analysis Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="size-6 text-success" />
                        <h3 className="text-lg font-bold">Forces</h3>
                      </div>
                      <ul className="space-y-3">
                        {analysis.strengths.map((strength: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="size-1.5 bg-success rounded-full mt-2 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="size-6 text-warning" />
                        <h3 className="text-lg font-bold">Risques</h3>
                      </div>
                      <ul className="space-y-3">
                        {analysis.risks.map((risk: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="size-1.5 bg-warning rounded-full mt-2 flex-shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-card rounded-2xl p-6 border border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="size-6 text-primary" />
                        <h3 className="text-lg font-bold">Recommandations</h3>
                      </div>
                      <ul className="space-y-3">
                        {analysis.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <div className="size-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        ) : (
          /* Team Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{member.photo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{member.name}</h3>
                      {member.isAdmin && (
                        <Shield className="size-4 text-primary flex-shrink-0" title="Admin" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${departmentColors[member.department]}`}>
                        {member.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail className="size-4" />
                  <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors truncate">
                    {member.email}
                  </a>
                </div>

                {member.discShared ? (
                  <>
                    <div className="bg-muted/30 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="size-4 text-primary" />
                        <span className="text-sm font-medium">Profil DISC: {member.disc.profile}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{member.disc.dominant}</span>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{member.disc.secondary}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMember(member)}
                      className="w-full px-4 py-2 bg-primary hover:bg-accent text-white rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="size-4" />
                      Analyse relationnelle
                    </button>
                  </>
                ) : (
                  <div className="bg-muted/20 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">Profil DISC non partagé</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
