import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import '../styles/fonts.css';
import { useAuth } from '../hooks/useAuth';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import OnboardingStep1 from './components/OnboardingStep1';
import OnboardingStep2 from './components/OnboardingStep2';
import OnboardingStep4 from './components/OnboardingStep4';
import OnboardingStep5 from './components/OnboardingStep5';
import Dashboard from './components/Dashboard';
import Meetings from './components/Meetings';
import MeetingAnalysis from './components/MeetingAnalysis';
import Coaching from './components/Coaching';
import Relations from './components/Relations';
import RelationDetail from './components/RelationDetail';
import ContactDetail from './components/ContactDetail';
import Contacts from './components/Contacts';
import Companies from './components/Companies';
import CompanyDetail from './components/CompanyDetail';
import BriefExterne from './components/BriefExterne';
import AccountSettings from './components/AccountSettings';
import SuperAdmin from './components/SuperAdmin';
import Subscription from './components/Subscription';
import CGU from './components/CGU';
import Privacy from './components/Privacy';
import Cookies from './components/Cookies';
import Sitemap from './components/Sitemap';
import { supabase } from '../lib/supabase';
import { getActiveOrganizationId } from '../lib/api/org';

function ContactRedirect() {
  const { id } = useParams();
  return <Navigate to={`/relation/${id}`} replace />;
}

/** Checks Supabase for onboarding completion flag */
async function checkOnboardingDone(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const orgId = await getActiveOrganizationId();
    if (!orgId) return false;
    const { data } = await (supabase as any)
      .from('profile_contexts')
      .select('source_payload')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();
    const onb = data?.source_payload?.onboarding;
    // Completed = step5 done OR completed_at present
    return Boolean(onb?.step5 || onb?.completed_at);
  } catch {
    return false;
  }
}

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
    Chargement de votre espace Knowr...
  </div>
);

/**
 * Guards authenticated app routes.
 * - Not logged in → /signin
 * - Logged in but onboarding not done → /onboarding/step1
 * - Logged in + onboarding done → show children
 */
function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }
    checkOnboardingDone().then(done => {
      if (!done) navigate('/onboarding/step1', { replace: true });
      setChecking(false);
    });
  }, [loading, isAuthenticated, user?.id]);

  if (loading || checking) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

/**
 * Guards onboarding routes.
 * - Not logged in → /signin
 * - Logged in + onboarding already complete → /dashboard (skip)
 * - Logged in + onboarding in progress → show onboarding step
 */
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'show' | 'done'>('checking');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setStatus('show'); // let the step handle the redirect to signin
      return;
    }
    checkOnboardingDone().then(done => {
      setStatus(done ? 'done' : 'show');
    });
  }, [loading, isAuthenticated, user?.id]);

  if (loading || status === 'checking') return <Spinner />;
  if (status === 'done') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/sitemap" element={<Sitemap />} />

        {/* Onboarding routes — auto-skip if already complete */}
        <Route path="/onboarding/step1" element={<OnboardingRoute><OnboardingStep1 /></OnboardingRoute>} />
        <Route path="/onboarding/step2" element={<OnboardingRoute><OnboardingStep2 /></OnboardingRoute>} />
        {/* Step 3 (CRM v2) retiré — toute entrée legacy redirige vers l'étape 3 actuelle */}
        <Route path="/onboarding/step3" element={<Navigate to="/onboarding/step4" replace />} />
        <Route path="/onboarding/step4" element={<OnboardingRoute><OnboardingStep4 /></OnboardingRoute>} />
        <Route path="/onboarding/step5" element={<OnboardingRoute><OnboardingStep5 /></OnboardingRoute>} />

        {/* Authenticated app routes — redirect to onboarding if not complete */}
        <Route path="/dashboard" element={<ProtectedApp><Layout><Dashboard /></Layout></ProtectedApp>} />
        <Route path="/meetings" element={<ProtectedApp><Layout><Meetings /></Layout></ProtectedApp>} />
        <Route path="/meeting/:id" element={<ProtectedApp><Layout><MeetingAnalysis /></Layout></ProtectedApp>} />
        {/* Coaching — V2, accès désactivé → redirect dashboard */}
        <Route path="/coaching" element={<Navigate to="/dashboard" replace />} />
        <Route path="/relations" element={<ProtectedApp><Layout><Relations /></Layout></ProtectedApp>} />
        <Route path="/relation/:id" element={<ProtectedApp><Layout><RelationDetail /></Layout></ProtectedApp>} />
        <Route path="/network" element={<Navigate to="/relations" replace />} />
        {/* Contacts list + detail — routes singulier et pluriel acceptées */}
        <Route path="/contacts" element={<ProtectedApp><Layout><Contacts /></Layout></ProtectedApp>} />
        <Route path="/contact/:id" element={<ProtectedApp><Layout><ContactDetail /></Layout></ProtectedApp>} />
        <Route path="/contacts/:id" element={<ProtectedApp><Layout><ContactDetail /></Layout></ProtectedApp>} />
        {/* Comptes (Accounts) */}
        <Route path="/companies" element={<ProtectedApp><Layout><Companies /></Layout></ProtectedApp>} />
        <Route path="/company/:id" element={<ProtectedApp><Layout><CompanyDetail /></Layout></ProtectedApp>} />
        {/* Brief externe (spec-38) — wedge d'acquisition sans inbox */}
        <Route path="/brief-externe" element={<ProtectedApp><Layout><BriefExterne /></Layout></ProtectedApp>} />
        <Route path="/subscription" element={<ProtectedApp><Layout><Subscription /></Layout></ProtectedApp>} />
        <Route path="/account" element={<ProtectedApp><Layout><AccountSettings /></Layout></ProtectedApp>} />
        <Route path="/super-admin" element={<ProtectedApp><Layout><SuperAdmin /></Layout></ProtectedApp>} />
      </Routes>
    </BrowserRouter>
  );
}
