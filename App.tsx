import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { FeaturesPreview } from './components/FeaturesPreview';
import { TestimonialCarousel } from './components/TestimonialCarousel';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { FeaturesPage } from './components/FeaturesPage';
import { ChatModal } from './components/ChatModal';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { AIDocumentGenerator } from './components/AIDocumentGenerator';
import { RiskAnalysisEngine } from './components/RiskAnalysisEngine';
import { UserDashboard } from './components/UserDashboard';
import { TrialOnboarding } from './components/TrialOnboarding';
import { LoadingScreen } from './components/LoadingScreen';
import { TrialStatusBanner } from './components/TrialStatusBanner';
import { UserMenu } from './components/UserMenu';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProfile } from './types/user';
import { 
  createTrialUser, 
  getTrialStatus, 
  upgradeUserToPro, 
  getTrialCredits, 
  useTrialCredits, 
  canUseCredits,
  getCreditStatus,
  CREDIT_COSTS 
} from './utils/trialHelpers';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showTrialOnboarding, setShowTrialOnboarding] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate trial days remaining
  useEffect(() => {
    if (user?.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (user.trial_days_remaining !== daysRemaining) {
        setUser(prev => prev ? { ...prev, trial_days_remaining: daysRemaining } : null);
      }
    }
  }, [user?.trial_end_date]);

  const handleAuthSuccess = (authUser: any, isTrialSignup: boolean = false) => {
    const userProfile = createTrialUser(authUser, isTrialSignup);
    setUser(userProfile);
    setIsAuthOpen(false);
    
    if (isTrialSignup) {
      setShowTrialOnboarding(true);
    }
  };

  const handleStartFreeTrial = () => {
    setIsAuthOpen(true);
  };

  const handleTrialOnboardingComplete = () => {
    setShowTrialOnboarding(false);
    setCurrentPage('dashboard');
  };

  const handleUpgradeToProJoin = () => {
    // Check if user has credits exhausted
    const creditsInfo = getCreditsInfo();
    if (user?.subscription_status === 'trial' && creditsInfo.credits <= 0) {
      // Show payment modal for exhausted users
      setIsPaymentOpen(true);
    } else {
      // Direct upgrade for users with credits remaining
      if (user) {
        setUser(upgradeUserToPro(user));
        setCurrentPage('dashboard');
      }
    }
  };

  const handlePaymentSuccess = (plan: string) => {
    if (user) {
      // Upgrade user to pro after successful payment
      const upgradedUser = upgradeUserToPro(user);
      setUser({
        ...upgradedUser,
        plan_type: plan === 'enterprise' ? 'enterprise' : 'professional'
      });
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserMenu(false);
    setCurrentPage('home');
  };

  const openAuthModal = () => {
    if (user) {
      setCurrentPage('dashboard');
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCreditUse = (creditType: string) => {
    if (!user || user.subscription_status !== 'trial') return true;

    const creditCost = CREDIT_COSTS[creditType]?.cost || 1;
    
    if (!canUseCredits(user, creditCost)) {
      // Open payment modal when credits are exhausted
      setIsPaymentOpen(true);
      return false;
    }

    const updatedUser = useTrialCredits(user, creditCost);
    if (updatedUser) {
      setUser(updatedUser);
    }
    
    return true;
  };

  const getCreditsInfo = () => {
    if (!user || user.subscription_status !== 'trial') {
      return { credits: Infinity, used: 0, max: Infinity };
    }
    return getTrialCredits(user);
  };

  // Pro account test credentials
  const handleProLogin = () => {
    const proUser = {
      id: 'pro-demo-user',
      email: 'pro@tradegenie.com',
      full_name: 'Pro Demo User',
      company: 'TradeGenie Inc.',
      subscription_status: 'active' as const,
      plan_type: 'professional' as const
    };
    setUser(proUser);
    setIsAuthOpen(false);
    setCurrentPage('dashboard');
  };

  const handleNavigateToDocuments = () => {
    setCurrentPage('document-generator');
  };

  const handleNavigateToRiskAnalysis = () => {
    setCurrentPage('risk-analysis');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'features':
        return (
          <FeaturesPage 
            onStartFreeTrial={handleStartFreeTrial}
            user={user}
            creditsInfo={getCreditsInfo()}
            onCreditUse={handleCreditUse}
            onNavigateToDocuments={handleNavigateToDocuments}
            onNavigateToRiskAnalysis={handleNavigateToRiskAnalysis}
          />
        );
      case 'document-generator':
        return (
          <AIDocumentGenerator
            user={user}
            creditsInfo={getCreditsInfo()}
            onCreditUse={handleCreditUse}
            onClose={() => setCurrentPage('features')}
          />
        );
      case 'risk-analysis':
        return (
          <RiskAnalysisEngine
            user={user}
            creditsInfo={getCreditsInfo()}
            onCreditUse={handleCreditUse}
            onClose={() => setCurrentPage('features')}
          />
        );
      case 'dashboard':
        return user ? (
          <UserDashboard 
            user={user} 
            onUpgrade={handleUpgradeToProJoin}
            creditsInfo={getCreditsInfo()}
          />
        ) : null;
      default:
        return (
          <>
            <HeroSection 
              onOpenChat={handleOpenChat} 
              onOpenAuth={openAuthModal}
            />
            <FeaturesPreview />
            <TestimonialCarousel />
            <CallToAction 
              onOpenChat={handleOpenChat} 
              onOpenAuth={openAuthModal}
              onStartFreeTrial={handleStartFreeTrial}
            />
          </>
        );
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const trialStatus = getTrialStatus(user);
  const creditStatus = getCreditStatus(user);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-cream-50">
        <div className="relative">
          <Navigation 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onOpenChat={handleOpenChat}
            onOpenAuth={openAuthModal}
            onStartFreeTrial={handleStartFreeTrial}
            onProLogin={handleProLogin}
          />
          
          {user && user.subscription_status === 'trial' && trialStatus && (
            <TrialStatusBanner 
              trialStatus={trialStatus} 
              onUpgrade={handleUpgradeToProJoin}
              creditStatus={creditStatus}
              creditsInfo={getCreditsInfo()}
            />
          )}
          
          {user && (
            <UserMenu
              user={user}
              trialStatus={trialStatus}
              showUserMenu={showUserMenu}
              onToggleMenu={() => setShowUserMenu(!showUserMenu)}
              onDashboard={() => {
                setCurrentPage('dashboard');
                setShowUserMenu(false);
              }}
              onUpgrade={() => {
                handleUpgradeToProJoin();
                setShowUserMenu(false);
              }}
              onLogout={handleLogout}
              creditsInfo={getCreditsInfo()}
            />
          )}
        </div>

        <main className={user && user.subscription_status === 'trial' && trialStatus ? 'pt-16' : ''}>
          {renderPage()}
        </main>

        <Footer />

        {/* Multilingual Dual AI-Powered Chat Modal */}
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={handleChatClose} 
          user={user}
          creditsInfo={getCreditsInfo()}
          onCreditUse={handleCreditUse}
          onUpgrade={handleUpgradeToProJoin}
        />
        
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          onAuthSuccess={handleAuthSuccess}
          enableTrialSignup={true}
          onProLogin={handleProLogin}
        />

        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          currentCredits={getCreditsInfo().credits}
        />

        <TrialOnboarding
          isOpen={showTrialOnboarding}
          onClose={() => setShowTrialOnboarding(false)}
          onComplete={handleTrialOnboardingComplete}
          user={user}
        />
      </div>
    </LanguageProvider>
  );
}