import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './state/AppContext'
import AppShell from './app/AppShell'
import SignIn from './pages/auth/SignIn'
import Onboarding from './pages/onboarding/Onboarding'
import HomePage from './pages/HomePage'
import PortfolioPage from './pages/PortfolioPage'
import PositionDetail from './pages/PositionDetail'
import IncomePage from './pages/IncomePage'
import WatchlistPage from './pages/WatchlistPage'
import DocumentsPage from './pages/DocumentsPage'
import DocumentReview from './pages/DocumentReview'
import PlanPage from './pages/PlanPage'
import OptionsPage from './pages/OptionsPage'
import RealEstatePage from './pages/RealEstatePage'
import PropertyDetail from './pages/PropertyDetail'
import PrivatePage from './pages/PrivatePage'
import LiabilitiesPage from './pages/LiabilitiesPage'
import InsurancePage from './pages/InsurancePage'
import TaxPage from './pages/TaxPage'
import ScenariosPage from './pages/ScenariosPage'
import ReportsPage from './pages/ReportsPage'
import InboxPage from './pages/InboxPage'
import TimelinePage from './pages/TimelinePage'
import SettingsPage from './pages/SettingsPage'
import TradingReviewPage from './pages/TradingReviewPage'
import ResearchLabPage from './pages/research/ResearchLabPage'
import ResearchDossierPage from './pages/research/ResearchDossierPage'
import ResearchComparePage from './pages/research/ResearchComparePage'
import ForensicIndexPage from './pages/research/ForensicIndexPage'
import ForensicMemoPage from './pages/research/ForensicMemoPage'
import BalancesPage from './pages/BalancesPage'
import LedgerPage from './pages/LedgerPage'
import ImportCenter from './pages/ImportCenter'
import PersonalIncome from './pages/PersonalIncome'
import PersonalWatchlist from './pages/PersonalWatchlist'
import PersonalPlan from './pages/PersonalPlan'
import PersonalReports from './pages/PersonalReports'
import PersonalScenarios from './pages/PersonalScenarios'
import PersonalTimeline from './pages/PersonalTimeline'

export default function App() {
  const app = useApp()
  const location = useLocation()
  const personal = app.dataMode === 'personal'
  const demoOnly = (el: React.ReactElement) => (personal ? <Navigate to="/" replace /> : el)

  if (!app.authenticated && location.pathname !== '/auth') {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<SignIn />} />
      </Routes>
    )
  }

  if (app.authenticated && !app.onboarded && location.pathname !== '/onboarding') {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/auth" element={<SignIn />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        {/* Personal-mode surfaces (canonical store) */}
        <Route path="/balances" element={personal ? <BalancesPage /> : <Navigate to="/portfolio" replace />} />
        <Route path="/ledger" element={personal ? <LedgerPage /> : <Navigate to="/" replace />} />
        {/* Shared routes with mode-specific implementations */}
        <Route path="/income" element={personal ? <PersonalIncome /> : <IncomePage />} />
        <Route path="/watchlist" element={personal ? <PersonalWatchlist /> : <WatchlistPage />} />
        <Route path="/documents" element={personal ? <ImportCenter /> : <DocumentsPage />} />
        <Route path="/plan" element={personal ? <PersonalPlan /> : <PlanPage />} />
        <Route path="/scenarios" element={personal ? <PersonalScenarios /> : <ScenariosPage />} />
        <Route path="/reports" element={personal ? <PersonalReports /> : <ReportsPage />} />
        <Route path="/timeline" element={personal ? <PersonalTimeline /> : <TimelinePage />} />
        {/* Always-real surfaces */}
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/trading-review" element={<TradingReviewPage />} />
        <Route path="/research" element={<ResearchLabPage />} />
        <Route path="/research/compare" element={<ResearchComparePage />} />
        <Route path="/research/forensic" element={<ForensicIndexPage />} />
        <Route path="/research/forensic/:symbol" element={<ForensicMemoPage />} />
        <Route path="/research/:symbol" element={<ResearchDossierPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Demo-household-only routes — blocked in personal mode */}
        <Route path="/portfolio" element={demoOnly(<PortfolioPage />)} />
        <Route path="/position/:symbol" element={demoOnly(<PositionDetail />)} />
        <Route path="/documents/review/:docId" element={demoOnly(<DocumentReview />)} />
        <Route path="/real-estate" element={demoOnly(<RealEstatePage />)} />
        <Route path="/real-estate/:id" element={demoOnly(<PropertyDetail />)} />
        <Route path="/private" element={demoOnly(<PrivatePage />)} />
        <Route path="/liabilities" element={demoOnly(<LiabilitiesPage />)} />
        <Route path="/insurance" element={demoOnly(<InsurancePage />)} />
        <Route path="/tax" element={demoOnly(<TaxPage />)} />
        <Route path="/inbox" element={demoOnly(<InboxPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
