import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router';
import '../styles/fonts.css';
import { useAuth } from '../hooks/useAuth';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import OnboardingStep1 from './components/OnboardingStep1';
import OnboardingStep2 from './components/OnboardingStep2';
import OnboardingStep3 from './components/OnboardingStep3';
import OnboardingStep4 from './components/OnboardingStep4';
import OnboardingStep5 from './components/OnboardingStep5';
import Dashboard from './components/Dashboard';
import Meetings from './components/Meetings';
import MeetingAnalysis from './components/MeetingAnalysis';
import Coaching from './components/Coaching';
import Relations from './components/Relations';
import RelationDetail from './components/RelationDetail';
import AccountSettings from './components/AccountSettings';
import Subscription from './components/Subscription';

function ContactRedirect() {
  const { id } = useParams();
  return <Navigate to={`/relation/${id}`} replace />;
}

function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement de votre espace Knowy...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes without sidebar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/onboarding/step1" element={<OnboardingStep1 />} />
        <Route path="/onboarding/step2" element={<OnboardingStep2 />} />
        <Route path="/onboarding/step3" element={<OnboardingStep3 />} />
        <Route path="/onboarding/step4" element={<OnboardingStep4 />} />
        <Route path="/onboarding/step5" element={<OnboardingStep5 />} />

        {/* Authenticated routes with sidebar */}
        <Route path="/dashboard" element={<ProtectedApp><Layout><Dashboard /></Layout></ProtectedApp>} />
        <Route path="/meetings" element={<ProtectedApp><Layout><Meetings /></Layout></ProtectedApp>} />
        <Route path="/meeting/:id" element={<ProtectedApp><Layout><MeetingAnalysis /></Layout></ProtectedApp>} />
        <Route path="/coaching" element={<ProtectedApp><Layout><Coaching /></Layout></ProtectedApp>} />
        <Route path="/relations" element={<ProtectedApp><Layout><Relations /></Layout></ProtectedApp>} />
        <Route path="/relation/:id" element={<ProtectedApp><Layout><RelationDetail /></Layout></ProtectedApp>} />
        <Route path="/network" element={<Navigate to="/relations" replace />} />
        <Route path="/contact/:id" element={<ContactRedirect />} />
        <Route path="/subscription" element={<ProtectedApp><Layout><Subscription /></Layout></ProtectedApp>} />
        <Route path="/account" element={<ProtectedApp><Layout><AccountSettings /></Layout></ProtectedApp>} />
      </Routes>
    </BrowserRouter>
  );
}
