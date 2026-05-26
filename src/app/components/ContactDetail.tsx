import { motion } from 'motion/react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Star,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Linkedin,
  Network,
  GraduationCap,
  FileText,
  TrendingUp,
  Zap,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  Users
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  photo: string;
  email: string;
  linkedin: string;
  linkedinConnections: number;
  mutualConnections: number;
  isDecisionMaker: boolean;
  thoughtLeader: boolean;
  careerMomentum?: 'new-role' | 'ascending';
  timeInRole: string;
  timeInCompany: string;
  joinDate: string;
  background: string;
  seniority: string;
  education: string;
  previousCompanies: string[];
  influenceScore: number;
  relationshipStrength: number;
  engagementScore: number;
  emails30d: number;
  meetings30d: number;
  lastContactDays: number;
  expertise: string[];
  motivationSignals: string[];
  communicationStyle: string;
  discProfile: string;
  keywords: string[];
  recentPosts?: { title: string; date: string; engagement: string }[];
  publications?: { title: string; date: string }[];
  recentInterests: string[];
  recentActivity: string;
}

interface Activity {
  id: string;
  type: 'email' | 'meeting' | 'note';
  date: string;
  subject: string;
  snippet?: string;
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // Mock data - in reality this would fetch from API
  const allContacts: Contact[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'VP of Partnerships',
      company: 'Contentsquare',
      photo: '👩‍💼',
      email: 'sarah.chen@contentsquare.com',
      linkedin: 'https://linkedin.com/in/sarahchen',
      linkedinConnections: 8500,
      mutualConnections: 12,
      isDecisionMaker: true,
      thoughtLeader: true,
      careerMomentum: 'new-role',
      timeInRole: '6 mois',
      timeInCompany: '2 ans',
      joinDate: 'Jan 2024',
      background: 'sales',
      seniority: '12+ ans d\'expérience',
      education: 'HEC Paris, Master in Management',
      previousCompanies: ['Salesforce', 'Google', 'Microsoft'],
      influenceScore: 88,
      relationshipStrength: 84,
      engagementScore: 88,
      emails30d: 24,
      meetings30d: 3,
      lastContactDays: 2,
      expertise: ['Strategic Partnerships', 'Business Development', 'Enterprise Sales', 'SaaS', 'Go-to-Market'],
      motivationSignals: ['Cherche à établir des partenariats stratégiques en EMEA pour accélérer la croissance. Focus sur l\'expansion internationale.'],
      communicationStyle: 'Direct et orienté résultats. Apprécie les données concrètes et les case studies.',
      discProfile: 'D/I',
      keywords: ['ROI', 'scale', 'partnership'],
      recentPosts: [
        { title: 'The future of digital analytics in 2026', date: 'Il y a 2 jours', engagement: '342' },
        { title: 'Why strategic partnerships matter more than ever', date: 'Il y a 1 semaine', engagement: '567' }
      ],
      publications: [
        { title: 'Building Strategic Partnerships in SaaS', date: '2025' }
      ],
      recentInterests: [
        'Expansion en Asie-Pacifique',
        'AI-powered analytics',
        'Partnership automation tools'
      ],
      recentActivity: 'Vient de rejoindre le conseil consultatif de 2 startups européennes. Très active sur LinkedIn avec focus sur l\'innovation en analytics.'
    },
    {
      id: '2',
      name: 'Alexandre Garcia',
      role: 'CFO',
      company: 'Qonto',
      photo: '👨‍💼',
      email: 'alexandre.garcia@qonto.com',
      linkedin: 'https://linkedin.com/in/alexandregarcia',
      linkedinConnections: 12000,
      mutualConnections: 8,
      isDecisionMaker: true,
      thoughtLeader: false,
      timeInRole: '18 mois',
      timeInCompany: '3 ans',
      joinDate: 'Oct 2022',
      background: 'finance',
      seniority: '15+ ans d\'expérience',
      education: 'ESSEC Business School, Finance',
      previousCompanies: ['BNP Paribas', 'Revolut', 'N26'],
      influenceScore: 94,
      relationshipStrength: 92,
      engagementScore: 94,
      emails30d: 45,
      meetings30d: 5,
      lastContactDays: 1,
      expertise: ['Financial Strategy', 'M&A', 'Fundraising', 'Unit Economics', 'Financial Planning'],
      motivationSignals: ['Prépare une nouvelle levée de fonds. Intéressé par des outils d\'optimisation financière et de prévision.'],
      communicationStyle: 'Analytique et précis. Demande toujours des preuves chiffrées et des projections financières détaillées.',
      discProfile: 'C/D',
      keywords: ['efficiency', 'metrics', 'ROI'],
      recentPosts: [
        { title: 'Managing cash flow in high-growth startups', date: 'Il y a 3 jours', engagement: '891' }
      ],
      recentInterests: [
        'AI pour la prévision financière',
        'Expansion européenne',
        'Stratégies de levée de fonds'
      ],
      recentActivity: 'Vient de finaliser une levée de fonds Series D. Très sollicité pour des conférences sur la finance en startup.'
    }
  ];

  const contact = allContacts.find(c => c.id === id);

  const activities: Activity[] = [
    { id: 'a1', type: 'meeting', date: '2026-05-20', subject: 'Q2 Partnership Review', snippet: 'Discussed expansion opportunities in EMEA region...' },
    { id: 'a2', type: 'email', date: '2026-05-18', subject: 'RE: Contract renewal discussion', snippet: 'Following up on our conversation about the renewal timeline...' },
    { id: 'a3', type: 'email', date: '2026-05-15', subject: 'Introduction to team members', snippet: 'Would love to connect you with our VP of Sales...' },
    { id: 'a4', type: 'meeting', date: '2026-05-10', subject: 'Strategic alignment call', snippet: 'Covered key priorities for the next quarter...' },
    { id: 'a5', type: 'email', date: '2026-05-08', subject: 'Product feedback session notes', snippet: 'Thanks for sharing your insights on the new features...' },
  ];

  const getDaysText = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  if (!contact) {
    return (
      <div className="size-full bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Contact introuvable</h2>
          <p className="text-muted-foreground mb-6">Ce contact n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate('/network')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-colors"
          >
            Retour au réseau
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Retour
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          {/* Condensed Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{contact.photo}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">{contact.name}</h3>
                  {contact.thoughtLeader && (
                    <Sparkles className="size-4 text-accent" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{contact.role}</p>
                <p className="text-sm font-medium text-primary mb-2">{contact.company}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {contact.isDecisionMaker && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                      <Star className="size-3 fill-primary" />
                      Décideur
                    </span>
                  )}
                  {contact.careerMomentum === 'new-role' && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-xs">
                      <Zap className="size-3" />
                      Nouveau rôle
                    </span>
                  )}
                  {contact.careerMomentum === 'ascending' && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs">
                      <TrendingUp className="size-3" />
                      Promotion
                    </span>
                  )}
                  <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                    {contact.timeInRole} dans le poste
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 bg-card hover:bg-muted/50 border border-border rounded-xl transition-colors flex items-center gap-2 text-sm">
                <Mail className="size-4" />
                Email
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-accent transition-colors flex items-center gap-2 text-sm">
                <Calendar className="size-4" />
                Meeting
              </button>
            </div>
          </div>

          {/* Condensed Scores */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Influence</span>
                <span className="text-lg font-semibold text-primary">{contact.influenceScore}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5">
                <div className="bg-primary rounded-full h-1.5" style={{ width: `${contact.influenceScore}%` }} />
              </div>
            </div>
            <div className="bg-success/5 border border-success/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Relation</span>
                <span className="text-lg font-semibold text-success">{contact.relationshipStrength}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5">
                <div className="bg-success rounded-full h-1.5" style={{ width: `${contact.relationshipStrength}%` }} />
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Engagement</span>
              </div>
              <p className="text-xl font-bold">{contact.engagementScore}</p>
              <div className="mt-2 w-full bg-border rounded-full h-1">
                <div
                  className={`rounded-full h-1 ${
                    contact.engagementScore >= 80 ? 'bg-success' :
                    contact.engagementScore >= 70 ? 'bg-primary' :
                    contact.engagementScore >= 60 ? 'bg-warning' :
                    'bg-destructive'
                  }`}
                  style={{ width: `${contact.engagementScore}%` }}
                />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Emails</span>
              </div>
              <p className="text-xl font-bold">{contact.emails30d}</p>
              <p className="text-xs text-muted-foreground mt-1">30 derniers jours</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Meetings</span>
              </div>
              <p className="text-xl font-bold">{contact.meetings30d}</p>
              <p className="text-xs text-muted-foreground mt-1">30 derniers jours</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">Dernier contact</span>
              </div>
              <p className={`text-xl font-bold ${
                contact.lastContactDays > 10 ? 'text-destructive' :
                contact.lastContactDays > 5 ? 'text-warning' :
                'text-success'
              }`}>
                {contact.lastContactDays}j
              </p>
              <p className="text-xs text-muted-foreground mt-1">{getDaysText(contact.lastContactDays)}</p>
            </div>
          </div>

          {/* DISC Comparison Section */}
          <div className="mb-6 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10 border-2 border-accent/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="size-5 text-accent" />
              <h3 className="text-lg font-semibold">Intelligence Relationnelle</h3>
              <span className="ml-auto text-xs px-2 py-1 bg-accent/20 text-accent rounded-full font-medium">
                Optimisé par DISC
              </span>
            </div>

            {/* Profile Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Votre profil</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-primary">D/I</span>
                  <div className="flex gap-1">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">Dominant</span>
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">Influent</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Direct, orienté résultats</p>
              </div>

              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-2">Son profil</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-success">{contact.discProfile}</span>
                  <div className="flex gap-1">
                    {contact.discProfile.includes('D') && <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">Dominant</span>}
                    {contact.discProfile.includes('I') && <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">Influent</span>}
                    {contact.discProfile.includes('S') && <span className="text-xs px-2 py-1 bg-success/10 text-success rounded">Stable</span>}
                    {contact.discProfile.includes('C') && <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded">Consciencieux</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{contact.communicationStyle}</p>
              </div>
            </div>

            {/* Communication Insights */}
            <div className="grid grid-cols-3 gap-3">
              {/* Optimize */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="size-4 text-success" />
                  <span className="text-xs font-bold text-success uppercase">Comment optimiser</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Soyez direct et concis</li>
                  <li>• Mettez l'accent sur les résultats</li>
                  <li>• Préparez des données chiffrées</li>
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="size-4 text-warning" />
                  <span className="text-xs font-bold text-warning uppercase">Risques à éviter</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Ne pas trop détailler</li>
                  <li>• Éviter les longs préambules</li>
                  <li>• Ne pas hésiter sur les décisions</li>
                </ul>
              </div>

              {/* Best Practices */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="size-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase">Communication</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Email: max 5 lignes</li>
                  <li>• Meeting: agenda précis</li>
                  <li>• Décision: proposez 2-3 options</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Top 3 Expertise */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Expertise</p>
            <div className="flex flex-wrap gap-2">
              {contact.expertise.slice(0, 3).map((skill, j) => (
                <span key={j} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Key Motivation Signal */}
          <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="size-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{contact.motivationSignals[0]}</p>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-accent transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="size-4" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="size-4" />
                Voir plus de détails
              </>
            )}
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-border mt-4"
            >
              {/* Contact Info */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Contact</p>
                <div className="flex flex-col gap-2 text-sm">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="size-4" />
                    {contact.email}
                  </a>
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="size-4" />
                    LinkedIn ({(contact.linkedinConnections / 1000).toFixed(1)}K connexions)
                  </a>
                  {contact.mutualConnections > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Network className="size-4" />
                      {contact.mutualConnections} connexions communes
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Dans l'entreprise</p>
                  <p className="font-medium">{contact.timeInCompany}</p>
                  <p className="text-xs text-muted-foreground mt-1">Depuis {contact.joinDate}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Background</p>
                  <p className="font-medium capitalize">{contact.background}</p>
                  <p className="text-xs text-muted-foreground mt-1">{contact.seniority}</p>
                </div>
              </div>

              {/* Education */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="size-4 text-primary" />
                  <p className="text-xs font-medium">Formation</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{contact.education}</p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.previousCompanies.map((company, j) => (
                    <span key={j} className="text-xs px-2 py-1 bg-muted rounded">
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              {/* All Expertise */}
              {contact.expertise.length > 3 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Toutes les expertises</p>
                  <div className="flex flex-wrap gap-2">
                    {contact.expertise.map((skill, j) => (
                      <span key={j} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Communication */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="size-4 text-primary" />
                  <p className="text-xs font-medium">Communication</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{contact.communicationStyle}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded">DISC: {contact.discProfile}</span>
                  {contact.keywords.slice(0, 3).map((keyword, j) => (
                    <span key={j} className="text-xs px-2 py-1 bg-muted rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              {contact.recentPosts && contact.recentPosts.length > 0 && (
                <div className="bg-accent/5 border border-accent/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin className="size-4 text-accent" />
                    <p className="text-xs font-medium">Posts LinkedIn récents</p>
                  </div>
                  {contact.recentPosts.map((post, j) => (
                    <div key={j} className="text-xs text-muted-foreground mb-1 last:mb-0">
                      "{post.title}" • {post.date} • {post.engagement} réactions
                    </div>
                  ))}
                </div>
              )}

              {/* Publications */}
              {contact.publications && contact.publications.length > 0 && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="size-4 text-primary" />
                    <p className="text-xs font-medium">Publications</p>
                  </div>
                  {contact.publications.map((pub, j) => (
                    <div key={j} className="text-xs text-muted-foreground mb-1 last:mb-0">
                      {pub.title} • {pub.date}
                    </div>
                  ))}
                </div>
              )}

              {/* Interests */}
              <div>
                <p className="text-xs font-medium mb-2">Intérêts récents</p>
                <ul className="space-y-1">
                  {contact.recentInterests.map((interest, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {interest}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Note */}
              <div className="bg-warning/5 border border-warning/10 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium mb-1">Note stratégique</p>
                    <p className="text-xs text-muted-foreground">{contact.recentActivity}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6 mt-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">Résumé Relationnel & Historique</h2>
            </div>
          </div>

          {/* Relationship Summary Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Key Moments */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="size-5 text-primary" />
                <h3 className="font-semibold">Key Moments</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Nouveau rôle VP Partnerships</p>
                    <p className="text-xs text-muted-foreground">Nov 2025 • Opportunité de repositionnement</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-sm font-medium">A mentionné expansion EMEA</p>
                    <p className="text-xs text-muted-foreground">Mai 2026 • Signal d'intérêt fort</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📈</span>
                  <div>
                    <p className="text-sm font-medium">Post LinkedIn sur partnerships SaaS</p>
                    <p className="text-xs text-muted-foreground">Il y a 5 jours • Très engagé</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What Works */}
            <div className="bg-gradient-to-br from-success/5 to-primary/5 border border-success/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-5 text-success" />
                <h3 className="font-semibold">What Works</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <p className="text-muted-foreground">Répond rapidement aux emails courts avec data</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <p className="text-muted-foreground">Préfère les meetings vidéo tôt le matin</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <p className="text-muted-foreground">Apprécie les case studies et ROI concrets</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  <p className="text-muted-foreground">Réactive aux mentions LinkedIn</p>
                </div>
              </div>
            </div>

            {/* Sensibilités */}
            <div className="bg-gradient-to-br from-warning/5 to-destructive/5 border border-warning/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="size-5 text-warning" />
                <h3 className="font-semibold">Sensibilités & Points d'attention</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚠</span>
                  <p className="text-muted-foreground">Ne pas comparer à son ancien employeur Datadog</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚠</span>
                  <p className="text-muted-foreground">Éviter les pitchs trop longs - aller droit au but</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">⚠</span>
                  <p className="text-muted-foreground">Sensible aux délais - toujours tenir ses promesses</p>
                </div>
              </div>
            </div>

            {/* Next Best Action */}
            <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="size-5 text-accent" />
                <h3 className="font-semibold">Next Best Action</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="text-sm font-medium mb-1">Proposer un coffee chat informel</p>
                    <p className="text-xs text-muted-foreground">
                      Moment idéal pour discuter expansion EMEA de manière décontractée
                    </p>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Calendar className="size-4" />
                  Planifier le coffee chat
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Separator */}
          <div className="border-t border-border mb-6 pt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="size-4" />
              Timeline des interactions
            </h3>
          </div>

          <div className="space-y-4">
            {activities.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <div className={`mt-1 p-2 rounded-lg ${
                  activity.type === 'meeting' ? 'bg-primary/10' :
                  activity.type === 'email' ? 'bg-blue-500/10' :
                  'bg-muted'
                }`}>
                  {activity.type === 'meeting' ? (
                    <Calendar className="size-4 text-primary" />
                  ) : activity.type === 'email' ? (
                    <Mail className="size-4 text-blue-600" />
                  ) : (
                    <MessageSquare className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  {activity.snippet && (
                    <p className="text-sm text-muted-foreground truncate">{activity.snippet}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Voir tout l'historique
          </button>
        </motion.div>
      </div>
    </div>
  );
}
