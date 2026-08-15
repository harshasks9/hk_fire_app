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

export default function App() {
  const app = useApp()
  const location = useLocation()

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
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/position/:symbol" element={<PositionDetail />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/review/:docId" element={<DocumentReview />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/trading-review" element={<TradingReviewPage />} />
        <Route path="/real-estate" element={<RealEstatePage />} />
        <Route path="/real-estate/:id" element={<PropertyDetail />} />
        <Route path="/private" element={<PrivatePage />} />
        <Route path="/liabilities" element={<LiabilitiesPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/tax" element={<TaxPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/research" element={<ResearchLabPage />} />
        <Route path="/research/compare" element={<ResearchComparePage />} />
        <Route path="/research/:symbol" element={<ResearchDossierPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
